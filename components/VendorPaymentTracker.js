import { useState } from "react";
import { format } from "date-fns";
import { Pencil, Save, X } from "lucide-react";

export default function VendorPaymentTracker({ orders: initialOrders }) {
  const [orders, setOrders] = useState(initialOrders || []);
  const [editIndex, setEditIndex] = useState(null);
  const [editedPayment, setEditedPayment] = useState("");

  const handleEdit = (index, currentPayment) => {
    setEditIndex(index);
    setEditedPayment(currentPayment || "");
  };

  const handleCancel = () => {
    setEditIndex(null);
    setEditedPayment("");
  };

  const handleSave = async (index) => {
    const updatedOrders = [...orders];
    const payment = Number(editedPayment) || 0;
    const grandTotal = Number(updatedOrders[index].grandTotal) || 0;
    const currentDate = format(new Date(), "yyyy-MM-dd");

    const balance = grandTotal - payment;
    const status =
      payment === 0
        ? "Not Paid"
        : payment < grandTotal
        ? "Partly Paid"
        : "Paid";

    updatedOrders[index] = {
      ...updatedOrders[index],
      paymentMade: payment,
      paymentDate: currentDate,
      balance,
      status,
    };

    setOrders(updatedOrders);
    setEditIndex(null);
    setEditedPayment("");

    try {
      await fetch(`/api/payments/${updatedOrders[index]._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMade: payment,
          paymentDate: currentDate,
          balance,
          status,
        }),
      });
    } catch (error) {
      console.error("Payment update failed", error);
    }
  };

  if (!orders.length) {
    return <p className="text-gray-500">No vendor orders found.</p>;
  }

  return (
    <div className="space-y-8">
      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-xl shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-300 text-sm">
          <thead className="bg-blue-50 text-gray-700 font-semibold uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Vendor</th>
              <th className="px-4 py-3 text-left">Contact</th>
              <th className="px-4 py-3 text-left">Products</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Paid</th>
              <th className="px-4 py-3 text-left">Pay Date</th>
              <th className="px-4 py-3 text-right">Balance</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {orders.map((order, index) => (
              <tr key={order._id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3">{order.date || "—"}</td>
                <td className="px-4 py-3 font-medium text-gray-800">
                  {order.supplier || "—"}
                </td>
            
                <td className="px-4 py-3">{order.contact || "—"}</td>
                <td className="px-4 py-3">
                  {Array.isArray(order.mainProduct)
                    ? order.mainProduct.map((item, idx) => (
                        <div key={idx} className="text-gray-600">
                          {item.product} × {item.quantity}
                        </div>
                      ))
                    : order.mainProduct || "—"}
                </td>
                <td className="px-4 py-3 text-right text-gray-700">
                  ₦{order.grandTotal?.toLocaleString() || 0}
                </td>
                <td className="px-4 py-3 text-right">
                 {editIndex === index ? (
  <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-end w-full sm:w-auto">
    <input
      type="number"
      min={0}
      className="border border-gray-300 rounded px-3 py-1 w-full sm:w-28 text-right text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
      value={editedPayment}
      onChange={(e) => setEditedPayment(e.target.value)}
    />
    <div className="flex gap-2 sm:flex-row flex-col w-full sm:w-auto">
      <button
        onClick={() => handleSave(index)}
        className="flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-md text-sm font-medium transition"
      >
        <Save size={14} /> Save
      </button>
      <button
        onClick={handleCancel}
        className="flex items-center justify-center gap-1 bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-md text-sm font-medium transition"
      >
        <X size={14} /> Cancel
      </button>
    </div>
  </div>
) : (
  <div className="flex items-center gap-2 justify-end">
    <span className="text-sm text-gray-800 font-medium">₦{order.paymentMade?.toLocaleString() || 0}</span>
    <button
      onClick={() => handleEdit(index, order.paymentMade)}
      className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition"
    >
      <Pencil size={14} /> Edit
    </button>
  </div>
)}


                </td>
                <td className="px-4 py-3">{order.paymentDate || "—"}</td>
                <td className="px-4 py-3 text-right">
                  ₦{order.balance?.toLocaleString() || 0}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                      order.status === "Paid"
                        ? "bg-green-100 text-green-800"
                        : order.status === "Partly Paid"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {order.status || "Not Paid"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-5">
        {orders.map((order, index) => (
          <div
            key={order._id}
            className="bg-white p-4 rounded-xl shadow-md border space-y-2"
          >
            <div className="text-lg font-semibold text-blue-800">
              {order.supplier}
            </div>
            <div className="text-sm text-gray-500">
              Invoice: {order.invoiceNumber || "—"} | {order.date}
            </div>
            <div className="text-sm">
              <strong>Contact:</strong> {order.contact || "—"}
            </div>
            <div className="text-sm">
              <strong>Products:</strong>{" "}
              {Array.isArray(order.mainProduct)
                ? order.mainProduct.map((p, i) => (
                    <div key={i}>
                      {p.product} × {p.quantity}
                    </div>
                  ))
                : order.mainProduct || "—"}
            </div>
            <div className="text-sm">
              <strong>Total:</strong> ₦{order.grandTotal?.toLocaleString()}
            </div>
        <div className="text-sm flex items-center gap-2 flex-wrap">
  <strong>Paid:</strong>
  {editIndex === index ? (
    <>
      <input
        type="number"
        className="border border-gray-300 px-2 py-1 w-45 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
        value={editedPayment}
        onChange={(e) => setEditedPayment(e.target.value)}
      />
      <button
        onClick={() => handleSave(index)}
        className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-xs"
      >
        <Save size={12} /> Save
      </button>
      <button
        onClick={handleCancel}
        className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-xs"
      >
        <X size={12} /> Cancel
      </button>
    </>
  ) : (
    <>
      ₦{order.paymentMade?.toLocaleString() || 0}
      <button
        onClick={() => handleEdit(index, order.paymentMade)}
        className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
      >
        <Pencil size={12} /> Edit
      </button>
    </>
  )}
</div>

            <div className="text-sm">
              <strong>Balance:</strong> ₦{order.balance?.toLocaleString() || 0}
            </div>
            <div className="text-sm">
              <strong>Pay Date:</strong> {order.paymentDate || "—"}
            </div>
            <div className="mt-2">
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  order.status === "Paid"
                    ? "bg-green-100 text-green-800"
                    : order.status === "Partly Paid"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {order.status || "Not Paid"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
