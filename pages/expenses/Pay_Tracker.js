import React, { useEffect, useState, useCallback, useMemo } from "react";
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
  const [paidFilter, setPaidFilter] = useState("all");
  const [customRange, setCustomRange] = useState({ start: null, end: null });
  const [reminderSent, setReminderSent] = useState(false);
  const [tableFilter, setTableFilter] = useState("all");

  const oustandingCheck = ["not paid", "partly paid"];

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
        const hasValidBalance =
          typeof o.balance === "number" && !Number.isNaN(o.balance);
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
        };
      });

  const getOverdueOrders = (list = []) => {
    const todayUTC = new Date();
    todayUTC.setUTCHours(0, 0, 0, 0);

    return (Array.isArray(list) ? list : []).filter((order) => {
      if (!order?.date) return false;
      const date = new Date(order.date);
      if (isNaN(date)) return false;

      const dueDateUTC = new Date(date);
      dueDateUTC.setUTCDate(dueDateUTC.getUTCDate() + 14);
      dueDateUTC.setUTCHours(0, 0, 0, 0);

      return order.status?.toLowerCase() !== "paid" && dueDateUTC < todayUTC;
    });
  };

  // ---------- Server fetch (authoritative) ----------
  const fetchOrders = useCallback(async (signal) => {
    setLoading(true);
    try {
      const res = await fetch("/api/stock-orders", { signal });
      const data = await res.json();
      if (!Array.isArray(data))
        throw new Error("Invalid response from /api/stock-orders");

      const normalized = normalizeOrders(data);
      setOrders(normalized);
      setDueOrders(getOverdueOrders(normalized));
    } catch (err) {
      if (err?.name === "AbortError") return; // ignore aborts
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // onOrdersChange passed to child will simply call fetchOrders()
  const handleOrdersChange = useCallback(() => {
    // trigger a fresh fetch (no args)
    fetchOrders();
  }, [fetchOrders]);

  // mount
  useEffect(() => {
    const ac = new AbortController();
    // load cookies
    const savedFilter = Cookies.get("paidFilter");
    const savedRange = Cookies.get("customRange");
    if (savedFilter) setPaidFilter(savedFilter);
    if (savedRange) {
      try {
        setCustomRange(JSON.parse(savedRange));
      } catch {}
    }

    fetchOrders(ac.signal);
    return () => ac.abort();
  }, [fetchOrders]);

  // persist cookies when filters change
  useEffect(() => {
    Cookies.set("paidFilter", paidFilter, { expires: 7 });
    Cookies.set("customRange", JSON.stringify(customRange), { expires: 7 });
  }, [paidFilter, customRange]);

  // Auto reminder when dueOrders appear (server-side cron endpoint)
  useEffect(() => {
    const sendReminder = async () => {
      if (dueOrders.length > 0 && !reminderSent) {
        try {
          await fetch("/api/stock-orders/cron", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dueOrders }),
          });
          setReminderSent(true);
        } catch (err) {
          console.error("Auto reminder failed:", err);
        }
      }
    };
    sendReminder();
  }, [dueOrders, reminderSent]);

  // ---------- Actions ----------
  const handleReminderSend = async () => {
    try {
      setSending(true);
      const res = await fetch("/api/stock-orders");
      const data = await res.json();
      const overdue = getOverdueOrders(normalizeOrders(data));

      if (overdue.length > 0) {
        await fetch("/api/stock-orders/cron", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dueOrders: overdue }),
        });

        setCountdown(5);
        const interval = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              setSending(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        alert("No overdue orders.");
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
      orders.filter((o) => oustandingCheck.includes(o?.status?.toLowerCase())),
    [orders]
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
      const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayEnd.getDate() + 1);

      const validStatuses = ["paid", "partly paid", "credit"];

      return orders
        .filter((o) => validStatuses.includes(o.status?.toLowerCase()))
        .filter((o) => {
          const date = new Date(o.paymentDate || o.date);
          if (isNaN(date)) return false;
          switch (filterType) {
            case "today":
            case "day":
              return date >= todayStart && date < todayEnd;
            case "week": {
              const weekAgo = new Date(todayStart);
              weekAgo.setDate(todayStart.getDate() - 7);
              return date >= weekAgo && date < todayEnd;
            }
            case "month": {
              const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
              return date >= monthStart && date < todayEnd;
            }
            case "period": {
              if (!range.start || !range.end) return true;
              const startDate = new Date(range.start);
              const endDate = new Date(range.end);
              endDate.setHours(23, 59, 59, 999);
              return date >= startDate && date <= endDate;
            }
            default:
              return true;
          }
        })
        .reduce((sum, o) => sum + toNumber(o.paymentMade), 0);
    },
    [orders]
  );

  const totalPaid = calculateFilteredTotalPaid(paidFilter, customRange);

const filteredOrdersForTable = useMemo(() => {
  if (tableFilter === "overdue") return overduePayments;
  if (tableFilter === "outstanding") return outstandingPayments;
  
  if (tableFilter === "paid") {
    return orders.filter(o => {
      if (!["paid", "partly paid", "credit"].includes(o.status?.toLowerCase())) return false;

      // apply date range filter if using custom period
      if (paidFilter === "period" && customRange.start && customRange.end) {
        const date = new Date(o.paymentDate || o.date);
        const start = new Date(customRange.start);
        const end = new Date(customRange.end);
        end.setHours(23, 59, 59, 999);
        return date >= start && date <= end;
      }

      return true; // all paid for other filters
    });
  }

  return orders;
}, [tableFilter, orders, overduePayments, outstandingPayments, paidFilter, customRange]);

  // ---------- Render ----------
  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-blue-800 mb-4">
            Vendor Payment Tracker
          </h1>

          <div className="flex flex-col lg:flex-row gap-6 w-full">
            {/* Overdue Orders */}
            <div className="flex-1">
              {unpaidDueOrders.length > 0 ? (
                <div className="bg-red-50 border border-red-200 text-red-800 p-5 rounded-xl shadow-md">
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
                            const date = new Date(order.date);
                            const dueDate = new Date(date);
                            dueDate.setDate(dueDate.getDate() + 14);
                            const daysOverdue = Math.floor(
                              (new Date() - dueDate) / (1000 * 60 * 60 * 24)
                            );

                            return (
                              <li key={i} className="text-xs md:text-sm">
                                <span className="font-medium">
                                  {order.supplier || "Unknown supplier"}
                                </span>{" "}
                                —{" "}
                                {order.date
                                  ? new Date(order.date).toLocaleDateString()
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

                  <p className="mt-3 text-green-600 font-medium text-xs md:text-sm">
                    Reminder sent automatically.
                  </p>

                  <button
                    onClick={handleReminderSend}
                    disabled={sending}
                    className={`mt-4 w-full sm:w-auto px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      sending
                        ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
                    }`}
                  >
                    {sending
                      ? countdown > 0
                        ? `✓ Reminder Sent — Wait ${countdown}s`
                        : "Sending Mail..."
                      : "📧 Send Vendor Reminder"}
                  </button>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 text-green-800 p-5 rounded-xl shadow-md text-sm">
                  ✅ No outstanding vendor payments. All clear!
                </div>
              )}
            </div>

            {/* Right Side */}
            <div className="flex flex-col lg:flex-row lg:w-[50%] gap-8">
              <div className="flex flex-col h-full gap-3 flex-1">
                <div>
<StatCard
  title="Total Paid"
  value={totalPaid}
  colorFrom="from-green-400"
  colorTo="to-green-600"
  options={[
    { value: "tillDate", label: "Till Date" },
    { value: "week", label: "Week" },
    { value: "month", label: "Month" },
    { value: "period", label: "Custom Period" },
  ]}
  onFilterChange={(filter) => {
    setPaidFilter(filter);       // update filter state
    setTableFilter("paid");      // table always shows paid orders

    // initialize customRange only when period is selected
    if (filter === "period" && (!customRange.start || !customRange.end)) {
      setCustomRange({ start: new Date(), end: new Date() });
    }
  }}
/>


  {/* Show date pickers only when "period" is selected */}
{paidFilter === "period" && (
  <div className="flex flex-col sm:gap-2 md:gap-0 mt-2 items-center">
    <DatePicker
      selected={customRange.start ? new Date(customRange.start) : null}
      onChange={(date) =>
        setCustomRange((prev) => ({ ...prev, start: date }))
      }
      selectsStart
      startDate={customRange.start}
      endDate={customRange.end}
      placeholderText="Start Date"
      className="border p-2 rounded"
    />
    <span>-</span>
    <DatePicker
      selected={customRange.end ? new Date(customRange.end) : null}
      onChange={(date) =>
        setCustomRange((prev) => ({ ...prev, end: date }))
      }
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




                <button
                  onClick={() => setTableFilter("all")}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium px-5 py-2 rounded-xl shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                >
                  Full Table
                </button>
              </div>

              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 mb-6 lg:grid-cols-1 gap-6">
                  <div
                    onClick={() => setTableFilter("overdue")}
                    className="cursor-pointer bg-gradient-to-br from-red-400 to-red-600 text-white p-6 rounded-2xl shadow-lg flex flex-col justify-center items-center transform hover:scale-[1.03] transition-all duration-300"
                  >
                    <span className="text-sm uppercase tracking-wide text-center pb-1 font-medium opacity-90 w-full border-b-2 border-gray-300">
                      Total Overdue Payments
                    </span>
                    <span className="text-lg text-gray-700 font-medium bg-gray-300 py-1 px-2 rounded-b-lg opacity-80">
                      {overduePayments.length} payments
                    </span>
                    <span className="mt-2 text-3xl font-bold drop-shadow-sm">
                      ₦{totalOverdueValue.toLocaleString()}
                    </span>
                  </div>

                  <div
                    onClick={() => setTableFilter("outstanding")}
                    className="cursor-pointer bg-gradient-to-br from-yellow-300 to-yellow-500 text-gray-900 p-6 rounded-2xl shadow-lg flex flex-col justify-center items-center transform hover:scale-[1.03] transition-all duration-300"
                  >
                    <span className="text-sm uppercase tracking-wide text-center pb-1 font-medium opacity-90 w-full border-b-2 border-gray-400">
                      Total Outstanding
                    </span>
                    <span className="text-lg text-gray-100 font-medium bg-gray-400 py-1 px-2 rounded-b-lg opacity-80">
                      {outstandingPayments.length} payments
                    </span>
                    <span className="mt-2 text-3xl font-bold drop-shadow-sm">
                      ₦{totalOutstanding.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="w-full h-20 bg-gray-100 mt-6">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <>
              <VendorPaymentTracker
                orders={filteredOrdersForTable}
                onOrdersChange={handleOrdersChange}
              />
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
