import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import VendorPaymentTracker from "@/components/VendorPaymentTracker";
import StatCard from "@/components/StatCard";

export default function PayTracker() {
  const [orders, setOrders] = useState([]);
  const [dueOrders, setDueOrders] = useState([]);
  const [reminderSent, setReminderSent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [paidFilter, setPaidFilter] = useState("all");
  const [customRange, setCustomRange] = useState({ start: null, end: null });

  const getOverdueOrders = (ordersList) => {
    const todayUTC = new Date();
    todayUTC.setUTCHours(0, 0, 0, 0);

    return ordersList.filter((order) => {
      if (!order.date) return false;

      console.log("Order List:", [ordersList[20]]);

      const date = new Date(order.date);
      if (isNaN(date)) return false;

      // Due date is 14 days after creation in UTC
      const dueDateUTC = new Date(date);
      dueDateUTC.setUTCDate(dueDateUTC.getUTCDate() + 14);
      dueDateUTC.setUTCHours(0, 0, 0, 0);

      // Ensure status check is consistent
      return order.status.toLowerCase() !== "paid" && dueDateUTC < todayUTC;
    });
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/stock-orders");
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error("Invalid response");

        setOrders(data);
        setDueOrders(getOverdueOrders(data));
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

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

function calculateFilteredTotalPaid(filterType, range = {}) {
  const now = new Date();

  // Normalize today to midnight local time
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1); // next day midnight

  const validStatuses = ["paid", "partly paid", "credit"];

  return orders
    .filter((o) => validStatuses.includes(o.status?.toLowerCase()))
    .filter((o) => {
      const date = new Date(o.paymentDate);
      if (isNaN(date)) return false;

      switch (filterType) {
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
    .reduce((sum, o) => sum + (o.paymentMade || 0), 0);
}



  const handleReminderSend = async () => {
    try {
      setSending(true);
      const res = await fetch("/api/stock-orders");
      const data = await res.json();

      const overdue = getOverdueOrders(data);

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

  const unpaidDueOrders = dueOrders.filter((o) => o.status !== "Paid");

  // Calculate totals
  const totalOverdueValue = unpaidDueOrders.reduce(
    (sum, order) => sum + (order.balance || 0),
    0
  );
  const totalOutstanding = orders
    .filter((o) => o.status.toLowerCase() !== "paid")
    .reduce((sum, order) => sum + (order.balance || 0), 0);
  const totalPaid = calculateFilteredTotalPaid(paidFilter, customRange);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-blue-800 mb-4">
            Vendor Payment Tracker
          </h1>

          <div className="flex flex-col lg:flex-row gap-6 w-full">
            {/* Left: Overdue Orders */}
            <div className="flex-1">
              {unpaidDueOrders.length > 0 ? (
                <div className="bg-red-50 border border-red-200 text-red-800 p-5 rounded-xl shadow-md">
                  <div className="font-semibold mb-3 text-sm md:text-base">
                    ⚠️ {unpaidDueOrders.length} Overdue Order
                    {unpaidDueOrders.length > 1 ? "s" : ""}
                  </div>

                  {/* Orders List */}
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
                    className={`mt-4 w-full sm:w-auto px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2
            ${
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

            <div className="flex flex-col lg:flex-row lg:w-[50%] gap-8">
              {/* Left: Total Paid */}
              <div className="flex flex-col h-full gap-3 flex-1">
                <StatCard
                  title="Total Paid"
                  value={totalPaid}
                  colorFrom="from-green-400"
                  colorTo="to-green-600"
                  options={[
                    { value: "today", label: "Till Date" },
                    { value: "week", label: "Week" },
                    { value: "month", label: "Month" },
                  ]}
                  onFilterChange={(filter) => {
                    if (filter === "period") {
                      // You could open a date picker here to set range
                      setCustomRange({
                        start: "2025-08-01",
                        end: "2025-08-10",
                      });
                    }
                    setPaidFilter(filter);
                  }}
                />
              </div>

              {/* Right: Totals */}
              <div className="flex flex-col gap-6 ">
                <div className="grid grid-cols-1 sm:grid-cols-2 mb-6 lg:grid-cols-1 gap-6">
                  {/* Overdue - No Filter */}
                  <div
                    className={`bg-gradient-to-br from-red-400 to-red-600 text-white p-6 rounded-2xl shadow-lg flex flex-col justify-center items-center transform hover:scale-[1.03] transition-all duration-300`}
                  >
                    <span className="text-sm uppercase tracking-wide font-medium opacity-90">
                      Total Overdue Value
                    </span>
                    <span className="mt-2 text-3xl font-bold drop-shadow-sm">
                      ₦{totalOverdueValue.toLocaleString()}
                    </span>
                  </div>

                  {/* Outstanding - No Filter */}
                  <div
                    className={`bg-gradient-to-br from-yellow-300 to-yellow-500 text-gray-900 p-6 rounded-2xl shadow-lg flex flex-col justify-center items-center transform hover:scale-[1.03] transition-all duration-300`}
                  >
                    <span className="text-sm uppercase tracking-wide font-medium opacity-90">
                      Total Outstanding
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
            <div className="w-full h-20 bg-gray-100">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <VendorPaymentTracker orders={orders} />
          )}
        </div>
      </div>
    </Layout>
  );
}
