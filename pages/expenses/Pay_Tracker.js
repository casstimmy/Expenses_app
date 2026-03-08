import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { VendorPaymentTracker } from "@/components/VendorPaymentTracker";
import Cookies from "js-cookie";
import Layout from "@/components/Layout";
import StatCard from "@/components/StatCard";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function PayTracker() {
  const [orders, setOrders] = useState([]); // normalized orders (stock received)
  const [dueOrders, setDueOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [paidFilter, setPaidFilter] = useState("tillDate");
  const [customRange, setCustomRange] = useState({ start: null, end: null });
  const [reminderSent, setReminderSent] = useState(false);
  const [tableFilter, setTableFilter] = useState("all");

  const outstandingCheck = ["not paid", "partly paid"];
  const reminderIntervalRef = useRef(null);
  const mountedRef = useRef(true);

  // ---------- Utils ----------
  const toNumber = (v) => {
    const n = Number(String(v ?? 0).replace(/,/g, ""));
    return Number.isFinite(n) ? n : 0;
  };

  const normalizeOrders = (list = []) =>
    (Array.isArray(list) ? list : [])
      .filter(
        (o) =>
          (o?.reason ?? "").toString().trim().toLowerCase() === "stock received"
      )
      .map((o) => {
        const grandTotal = toNumber(o.grandTotal);
        const paymentMade = toNumber(o.paymentMade);
        const balance = grandTotal - paymentMade;

        let status = o.status;
        if (!status) {
          if (paymentMade === 0) status = "Not Paid";
          else if (paymentMade < grandTotal) status = "Partly Paid";
          else if (paymentMade === grandTotal) status = "Paid";
          else status = "Credit";
        }

        return {
          ...o,
          _id: o?._id != null ? String(o._id) : undefined,
          grandTotal,
          paymentMade,
          balance,
          status,
          payBeforeSupply: !!o.payBeforeSupply,
        };
      });

  // Prefer order.date as base for due calculation, fallback to createdAt then paymentDate
  const getOrderDate = (o) => {
    if (!o) return null;
    return o?.date || o?.createdAt || o?.paymentDate || null;
  };

  // Helper: return a Date truncated to local midnight
  const startOfDay = (d) => {
    const dt = new Date(d);
    if (isNaN(dt)) return null;
    dt.setHours(0, 0, 0, 0);
    return dt;
  };

  const getOverdueOrders = (list = []) => {
    const today = startOfDay(new Date());
    if (!today) return [];

    return (Array.isArray(list) ? list : []).filter((order) => {
      const dStr = getOrderDate(order);
      if (!dStr) return false;
      const date = new Date(dStr);
      if (isNaN(date)) return false;

      const dueDate = startOfDay(date);
      if (!dueDate) return false;
      dueDate.setDate(dueDate.getDate() + 14); // due = order date + 14 days

      const status = (order.status || "").toString().toLowerCase();
      const isPaid = status === "paid";

      // overdue if not paid and dueDate is before today
      return !isPaid && dueDate < today;
    });
  };

  // ---------- Server fetch (authoritative) ----------
  const fetchOrders = useCallback(async (signal) => {
    setLoading(true);
    try {
      const res = await fetch("/api/stock-orders", signal ? { signal } : undefined);
      if (!res.ok) {
        console.error("fetch /api/stock-orders failed:", res.status);
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (!Array.isArray(data)) {
        console.error("Invalid response from /api/stock-orders");
        setLoading(false);
        return;
      }

      const normalized = normalizeOrders(data);
      if (!mountedRef.current) return;
      setOrders(normalized);
      setDueOrders(getOverdueOrders(normalized));
    } catch (err) {
      if (err?.name === "AbortError") return; // ignore aborts
      console.error("Failed to fetch orders:", err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // onOrdersChange passed to child will simply call fetchOrders()
  const handleOrdersChange = useCallback(() => {
    fetchOrders();
  }, [fetchOrders]);

  // mount
  useEffect(() => {
    mountedRef.current = true;
    const ac = new AbortController();
    // load cookies
    const savedFilter = Cookies.get("paidFilter");
    const savedRange = Cookies.get("customRange");
    if (savedFilter) setPaidFilter(savedFilter);
    if (savedRange) {
      try {
        const parsed = JSON.parse(savedRange);
        const start = parsed?.start ? new Date(parsed.start) : null;
        const end = parsed?.end ? new Date(parsed.end) : null;
        setCustomRange({ start, end });
      } catch {
        // ignore parse errors
      }
    }

    fetchOrders(ac.signal);
    return () => {
      ac.abort();
      mountedRef.current = false;
      if (reminderIntervalRef.current) {
        clearInterval(reminderIntervalRef.current);
        reminderIntervalRef.current = null;
      }
    };
  }, [fetchOrders]);

  // persist cookies when filters change
  useEffect(() => {
    Cookies.set("paidFilter", paidFilter, { expires: 7 });
    Cookies.set(
      "customRange",
      JSON.stringify({
        start: customRange.start ? new Date(customRange.start).toISOString() : null,
        end: customRange.end ? new Date(customRange.end).toISOString() : null,
      }),
      { expires: 7 }
    );
  }, [paidFilter, customRange]);

  // reset reminder state when dueOrders updates so manual send button can be used again
  useEffect(() => {
    if (reminderIntervalRef.current) {
      clearInterval(reminderIntervalRef.current);
      reminderIntervalRef.current = null;
    }
    setCountdown(0);
    setReminderSent(false);
  }, [dueOrders]);

  // ---------- Actions ----------
  const clearCountdown = () => {
    if (reminderIntervalRef.current) {
      clearInterval(reminderIntervalRef.current);
      reminderIntervalRef.current = null;
    }
    setCountdown(0);
  };

  const handleReminderSend = async () => {
    try {
      setSending(true);
      const res = await fetch("/api/stock-orders");
      if (!res.ok) {
        console.error("Failed to fetch orders for reminder:", res.status);
        setSending(false);
        return;
      }
      const data = await res.json();
      const overdue = getOverdueOrders(normalizeOrders(data));

      if (overdue.length > 0) {
        const cronRes = await fetch("/api/stock-orders/cron", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dueOrders: overdue }),
        });
        if (!cronRes.ok) {
          console.error("Failed to trigger cron:", cronRes.status);
          setSending(false);
          return;
        }

        if (!mountedRef.current) { setSending(false); return; }
        setReminderSent(true);
        setCountdown(5);

        // start countdown and clear on unmount
        reminderIntervalRef.current = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearCountdown();
              setSending(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        // no overdue orders found
        console.info("No overdue orders to remind.");
        setSending(false);
      }
    } catch (err) {
      console.error("Manual reminder failed:", err);
      setSending(false);
    }
  };

  // ---------- Derived (memoized) ----------
  const unpaidDueOrders = useMemo(
    () =>
      dueOrders.filter(
        (o) => !["paid", "credit"].includes(o?.status?.toLowerCase())
      ),
    [dueOrders]
  );
  const overduePayments = unpaidDueOrders;
  const outstandingPayments = useMemo(
    () =>
      orders.filter((o) => outstandingCheck.includes(o?.status?.toLowerCase()) && !o.payBeforeSupply),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [orders]
  );

  const creditOrders = useMemo(
    () => orders.filter((o) => o?.status?.toLowerCase() === "credit"),
    [orders]
  );

  const totalCreditValue = useMemo(
    () => creditOrders.reduce((sum, o) => sum + toNumber(Math.abs(o.balance ?? 0)), 0),
    [creditOrders]
  );

  const totalOverdueValue = useMemo(
    () =>
      overduePayments.reduce(
        (sum, order) => sum + toNumber(order.balance ?? order.grandTotal ?? 0),
        0
      ),
    [overduePayments]
  );
  const totalOutstanding = useMemo(
    () =>
      outstandingPayments.reduce(
        (sum, order) => sum + toNumber(order.balance ?? order.grandTotal ?? 0),
        0
      ),
    [outstandingPayments]
  );

  const calculateFilteredTotalPaid = useCallback(
    (filterType, range = {}) => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayEnd.getDate() + 1);

      const validStatuses = ["paid", "partly paid", "credit"];

      return orders
        .filter((o) => validStatuses.includes(o.status?.toLowerCase()))
        .filter((o) => {
          const date = new Date(getOrderDate(o));
          if (isNaN(date)) return false;
          const orderDate = startOfDay(date);
          
          switch (filterType) {
            case "today":
            case "day":
              return orderDate >= todayStart && orderDate < todayEnd;
            
            case "week":
            case "thisWeek": {
              // Start of this week (Sunday)
              const startOfWeek = new Date(todayStart);
              const day = startOfWeek.getDay();
              startOfWeek.setDate(todayStart.getDate() - day);
              return orderDate >= startOfWeek && orderDate < todayEnd;
            }
            
            case "lastWeek": {
              // Start of last week (Sunday) to end of last week (Saturday)
              const startOfWeek = new Date(todayStart);
              const day = startOfWeek.getDay();
              startOfWeek.setDate(todayStart.getDate() - day - 7); // Go back to last Sunday
              const endOfLastWeek = new Date(startOfWeek);
              endOfLastWeek.setDate(startOfWeek.getDate() + 7); // Add 7 days for Saturday end
              return orderDate >= startOfWeek && orderDate < endOfLastWeek;
            }
            
            case "month":
            case "thisMonth": {
              const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
              return orderDate >= monthStart && orderDate < todayEnd;
            }
            
            case "lastMonth": {
              const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
              const monthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
              monthEnd.setHours(23, 59, 59, 999);
              return orderDate >= lastMonthDate && orderDate <= monthEnd;
            }
            
            case "period": {
              if (!range.start || !range.end) return true;
              const startDate = new Date(range.start);
              startDate.setHours(0, 0, 0, 0);
              const endDate = new Date(range.end);
              endDate.setHours(23, 59, 59, 999);
              return orderDate >= startDate && orderDate <= endDate;
            }
            
            case "tillDate":
            default:
              return true;
          }
        })
        .reduce((sum, o) => sum + toNumber(o.paymentMade), 0);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [orders]
  );

  const totalPaid = calculateFilteredTotalPaid(paidFilter, customRange);

  const filteredOrdersForTable = useMemo(() => {
    if (tableFilter === "overdue") return overduePayments;
    if (tableFilter === "outstanding") return outstandingPayments;

    if (tableFilter === "paid") {
      return orders.filter((o) => {
        if (!["paid", "partly paid", "credit"].includes(o.status?.toLowerCase()))
          return false;

        // apply date range filter if using custom period
        if (paidFilter === "period" && customRange.start && customRange.end) {
          const date = new Date(getOrderDate(o));
          const start = new Date(customRange.start);
          const end = new Date(customRange.end);
          end.setHours(23, 59, 59, 999);
          return date >= start && date <= end;
        }

        return true; // all paid for other filters
      });
    }

    return orders;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tableFilter,
    orders,
    overduePayments,
    outstandingPayments,
    paidFilter,
    customRange,
  ]);

  // ---------- Render ----------
  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 p-3 sm:p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-800 mb-3 sm:mb-4">
            Vendor Payment Tracker
          </h1>

          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 w-full">
            {/* Left Side: Overdue Orders + Credit Orders */}
            <div className="w-full lg:w-1/2 flex flex-col gap-4">
              {unpaidDueOrders.length > 0 ? (
                <div className="bg-red-50 border border-red-200 text-red-800 p-3 sm:p-5 rounded-xl shadow-md">
                  <div className="font-semibold mb-3 text-sm md:text-base">
                    ⚠️ {unpaidDueOrders.length} Overdue Order
                    {unpaidDueOrders.length > 1 ? "s" : ""}
                  </div>

                  <div className="flex flex-wrap gap-8">
                    {Array.from({
                      length: Math.ceil(unpaidDueOrders.length / 5),
                    }).map((_, colIndex) => (
                      <ul key={colIndex} className="list-disc pl-5 space-y-1">
                        {unpaidDueOrders
                          .slice(colIndex * 5, colIndex * 5 + 5)
                          .map((order, i) => {
                            const date = new Date(getOrderDate(order) || order.date);
                            const dueDate = new Date(date);
                            dueDate.setDate(dueDate.getDate() + 14);
                            const daysOverdue = Math.floor(
                              (startOfDay(new Date()) - startOfDay(dueDate)) / (1000 * 60 * 60 * 24)
                            );

                            return (
                              <li key={order._id ?? i} className="text-xs md:text-sm">
                                <span className="font-medium">
                                  {order.supplier || "Unknown supplier"}
                                </span>{" "}
                                —{" "}
                                {getOrderDate(order)
                                  ? new Date(getOrderDate(order)).toLocaleDateString()
                                  : "No Date"}{" "}
                                <span className="text-red-500 font-medium">
                                  ({daysOverdue} days overdue)
                                </span>
                              </li>
                            );
                          })}
                      </ul>
                    ))}
                  </div>

                  {/* only show when reminder actually sent or while sending */}
                  {(reminderSent || sending) && (
                    <p className="mt-3 text-green-600 font-medium text-xs md:text-sm">
                      {sending ? "Sending reminders..." : "Reminder sent automatically."}
                    </p>
                  )}

                  <button
                    onClick={handleReminderSend}
                    disabled={sending || reminderSent}
                    aria-label="Send vendor reminder"
                    className={`mt-4 w-full sm:w-auto px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      sending || reminderSent
                        ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
                    }`}
                  >
                    {sending
                      ? countdown > 0
                        ? `✓ Reminder Sent — Wait ${countdown}s`
                        : "Sending Mail..."
                      : reminderSent
                      ? "✓ Reminder Sent"
                      : "📧 Send Vendor Reminder"}
                  </button>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 text-green-800 p-5 rounded-xl shadow-md text-sm">
                  ✅ No OverDue outstanding vendor payments.
                </div>
              )}

              {/* Credit List */}
              {creditOrders.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 sm:p-5 rounded-xl shadow-md mt-4">
                  <div className="font-semibold mb-3 text-sm md:text-base flex items-center justify-between">
                    <span>💳 {creditOrders.length} Credit Order{creditOrders.length > 1 ? "s" : ""}</span>
                    <span className="text-xs sm:text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">
                      ₦{totalCreditValue.toLocaleString()}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {creditOrders.map((order, i) => (
                      <div key={order._id ?? i} className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm bg-white px-3 py-2 rounded-lg border border-blue-100">
                        <div>
                          <span className="font-medium">{order.supplier || "Unknown"}</span>
                          <span className="text-gray-400 ml-2">
                            {order.date ? new Date(order.date).toLocaleDateString() : ""}
                          </span>
                        </div>
                        <div className="flex gap-3">
                          <span className="text-gray-600">Total: ₦{toNumber(order.grandTotal).toLocaleString()}</span>
                          <span className="text-green-700 font-medium">Paid: ₦{toNumber(order.paymentMade).toLocaleString()}</span>
                          <span className="text-blue-700 font-bold">Credit: ₦{Math.abs(toNumber(order.balance)).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Side: Stats Cards */}
            <div className="w-full lg:w-1/2 flex flex-col gap-3 sm:gap-6">
              {/* Total Paid Card */}
              <div>
                <StatCard
                  title="Total Paid"
                  value={totalPaid}
                  colorFrom="from-green-400"
                  colorTo="to-green-600"
                  options={[
                    { value: "tillDate", label: "Till Date" },
                    { value: "thisWeek", label: "This Week" },
                    { value: "lastWeek", label: "Last Week" },
                    { value: "thisMonth", label: "This Month" },
                    { value: "lastMonth", label: "Last Month" },
                    { value: "period", label: "Custom Period" },
                  ]}
                  onFilterChange={(filter) => {
                    setPaidFilter(filter);
                    setTableFilter("paid");
                    if (filter === "period" && (!customRange.start || !customRange.end)) {
                      setCustomRange({ start: new Date(), end: new Date() });
                    }
                  }}
                />

                {paidFilter === "period" && (
                  <div className="flex flex-col sm:gap-2 md:gap-0 mt-2 items-center">
                    <DatePicker
                      selected={customRange.start ? new Date(customRange.start) : null}
                      onChange={(date) => setCustomRange((prev) => ({ ...prev, start: date }))}
                      selectsStart
                      startDate={customRange.start}
                      endDate={customRange.end}
                      placeholderText="Start Date"
                      className="border p-2 rounded"
                    />
                    <span>-</span>
                    <DatePicker
                      selected={customRange.end ? new Date(customRange.end) : null}
                      onChange={(date) => setCustomRange((prev) => ({ ...prev, end: date }))}
                      selectsEnd
                      startDate={customRange.start}
                      endDate={customRange.end}
                      minDate={customRange.start}
                      placeholderText="End Date"
                      className="border p-2 rounded"
                    />
                  </div>
                )}
              </div>

              {/* Full Table Button */}
              <button
                onClick={() => setTableFilter("all")}
                aria-label="Show full table"
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium px-5 py-2 rounded-xl shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 w-full"
              >
                Full Table
              </button>

              {/* Stats Cards Grid - 2 column on all screens */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div
                  onClick={() => setTableFilter("overdue")}
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer bg-gradient-to-br from-red-400 to-red-600 text-white p-3 sm:p-4 rounded-2xl shadow-lg flex flex-col justify-center items-center transform hover:scale-[1.03] transition-all duration-300 min-h-[120px]"
                >
                  <span className="text-[11px] sm:text-xs uppercase tracking-wide text-center pb-1 font-semibold opacity-90 w-full border-b border-gray-300">
                    Overdue
                  </span>
                  <span className="text-xs sm:text-sm text-gray-200 font-medium mt-1">
                    {overduePayments.length} orders
                  </span>
                  <span className="mt-auto text-lg sm:text-2xl font-bold drop-shadow-sm text-center">
                    ₦{totalOverdueValue.toLocaleString()}
                  </span>
                </div>

                <div
                  onClick={() => setTableFilter("outstanding")}
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer bg-gradient-to-br from-yellow-300 to-yellow-500 text-gray-900 p-3 sm:p-4 rounded-2xl shadow-lg flex flex-col justify-center items-center transform hover:scale-[1.03] transition-all duration-300 min-h-[120px]"
                >
                  <span className="text-[11px] sm:text-xs uppercase tracking-wide text-center pb-1 font-semibold opacity-90 w-full border-b border-gray-400">
                    Outstanding
                  </span>
                  <span className="text-xs sm:text-sm text-gray-700 font-medium mt-1">
                    {outstandingPayments.length} orders
                  </span>
                  <span className="mt-auto text-lg sm:text-2xl font-bold drop-shadow-sm text-center">
                    ₦{totalOutstanding.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="w-full h-20 bg-gray-100 mt-8">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <div className="mt-8">
              <VendorPaymentTracker orders={filteredOrdersForTable} onOrdersChange={handleOrdersChange} />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}