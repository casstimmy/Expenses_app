import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import VendorPaymentTracker from "@/components/VendorPaymentTracker";

export default function PayTracker() {
  const [orders, setOrders] = useState([]);
  const [dueOrders, setDueOrders] = useState([]);
  const [reminderSent, setReminderSent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // 🔁 Shared logic to filter overdue orders based on createdAt
  const getOverdueOrders = (ordersList) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return ordersList.filter((order) => {
      const createdAt = order.createdAt ? new Date(order.createdAt) : null;
      if (!createdAt || isNaN(createdAt)) return false;

      // Add 14 days to the createdAt date
      const dueDate = new Date(createdAt);
      dueDate.setDate(dueDate.getDate() + 14);
      dueDate.setHours(0, 0, 0, 0);

      return order.status !== "fulfilled" && dueDate < today;
    });
  };

  // 📦 Fetch orders and compute overdue ones
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

  // 📤 Auto send reminder once
  useEffect(() => {
    const sendReminder = async () => {
      if (dueOrders.length > 0 && !reminderSent) {
        try {
          await fetch("/api/stock-orders/send-reminder", {
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

  // 👆 Manual trigger for reminder
  const handleReminderSend = async () => {
    try {
      setSending(true);
      const res = await fetch("/api/stock-orders");
      const data = await res.json();

      const overdue = getOverdueOrders(data);

      if (overdue.length > 0) {
        await fetch("/api/stock-orders/send-reminder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dueOrders: overdue }),
        });

        setCountdown(5); // Start countdown from 5
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

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-blue-800 mb-4">
            Vendor Payment Tracker
          </h1>

          {dueOrders.length > 0 && (
            <div className="bg-red-100 border border-red-300 text-red-700 p-3 rounded-lg mb-4 shadow-sm text-xs md:text-sm max-w-md">
              <div className="font-semibold mb-1">
                ⚠️ {dueOrders.length} Overdue Order
                {dueOrders.length > 1 ? "s" : ""}
              </div>
              <ul className="list-disc pl-4">
                {dueOrders.slice(0, 3).map((order, i) => (
                  <li key={i}>
                    {order.supplier || "Unknown supplier"} —{" "}
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString()
                      : "No Date"}
                  </li>
                ))}
              </ul>
              {dueOrders.length > 3 && (
                <p className="mt-1 italic">+{dueOrders.length - 3} more</p>
              )}
              <p className="mt-2 text-green-600 font-medium">
                Reminder sent automatically.
              </p>
              <button
                onClick={handleReminderSend}
                disabled={sending}
                className={`px-6 py-2 my-4 rounded-sm text-sm font-medium transition-all duration-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2
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
          )}

          {loading ? (
            <div className="w-full h-20 bg-gray-100 ">
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
