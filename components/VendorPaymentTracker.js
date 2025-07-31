import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Pencil, Save, X } from "lucide-react";
import Link from "next/link";

export default function VendorPaymentTracker({ orders: initialOrders }) {
  const [orders, setOrders] = useState(
    (initialOrders || []).filter((order) => order.reason === "Stock Received")
  );
  const [editIndex, setEditIndex] = useState(null);
  const [editedPayment, setEditedPayment] = useState("");
  const [selectedVendor, setSelectedVendor] = useState("");
  const [vendors, setVendors] = useState([]);

  useEffect(() => {
    const uniqueVendors = Array.from(
      new Set(orders.map((order) => order.vendor?.name).filter(Boolean))
    );
    setVendors(uniqueVendors);
  }, [orders]);

  const filteredOrders = Array.isArray(orders)
    ? selectedVendor
      ? orders.filter((order) => order.vendor?.name === selectedVendor)
      : orders
    : [];

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

  if (!filteredOrders.length) {
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
              <th className="px-4 py-3 text-left">Memo</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filteredOrders.map((order, index) => (
              <tr key={order._id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3">
                  {order.date
                    ? format(new Date(order.date), "dd MMM yyyy")
                    : "—"}
                </td>
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
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-end">
                      <input
                        type="number"
                        min={0}
                        className="border border-gray-300 rounded px-3 py-1 w-full sm:w-28 text-right text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        value={editedPayment}
                        onChange={(e) => setEditedPayment(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSave(index)}
                          className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-md text-sm font-medium transition"
                        >
                          <Save size={14} /> Save
                        </button>
                        <button
                          onClick={handleCancel}
                          className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-md text-sm font-medium transition"
                        >
                          <X size={14} /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-sm font-medium">
                        ₦{order.paymentMade?.toLocaleString() || 0}
                      </span>
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
                <td className="px-4 py-3">
                  <Link href={`/memo/${order._id}`} passHref legacyBehavior>
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 inline-block"
                    >
                      View Memo
                    </a>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-5">
        {filteredOrders.map((order, index) => (
          <div
            key={order._id}
            className="bg-white p-4 rounded-xl shadow-md border border-gray-200 space-y-3"
          >
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-semibold text-gray-800">
                  {order.supplier || "Unknown Vendor"}
                </h2>
                <p className="text-xs text-gray-500">
                  {order.date
                    ? format(new Date(order.date), "dd MMM yyyy")
                    : "—"}
                </p>
              </div>
              <Link href={`/memo/${order._id}`} passHref legacyBehavior>
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 inline-block"
                >
                  View Memo
                </a>
              </Link>
            </div>

            <div className="text-sm text-gray-600">
              <strong>Contact:</strong> {order.contact || "—"}
            </div>

            {/* Products */}
            <div className="text-sm">
              <strong>Products:</strong>{" "}
              <div className="pl-2 mt-1 space-y-1">
                {Array.isArray(order.mainProduct) ? (
                  order.mainProduct.map((p, i) => (
                    <div key={i} className="text-gray-700 text-sm">
                      {p.product} × {p.quantity}
                    </div>
                  ))
                ) : (
                  <div>{order.mainProduct || "—"}</div>
                )}
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* Payment Info */}
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
              <div>
                <strong>Total:</strong>
                <div>₦{order.grandTotal?.toLocaleString() || 0}</div>
              </div>
              <div>
                <strong>Balance:</strong>
                <div>₦{order.balance?.toLocaleString() || 0}</div>
              </div>
              <div>
                <strong>Status:</strong>
                <div
                  className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${
                    order.status === "Paid"
                      ? "bg-green-100 text-green-700"
                      : order.status === "Partly Paid"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {order.status || "Not Paid"}
                </div>
              </div>
              <div>
                <strong>Pay Date:</strong>
                <div>{order.paymentDate || "—"}</div>
              </div>
            </div>

            {/* Editable Paid Field */}
            <div className="text-sm mt-3">
              <strong>Paid:</strong>{" "}
              {editIndex === index ? (
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <input
                    type="number"
                    className="border border-gray-300 px-3 py-1 rounded w-28 text-sm"
                    value={editedPayment}
                    onChange={(e) => setEditedPayment(e.target.value)}
                  />
                  <button
                    onClick={() => handleSave(index)}
                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs"
                  >
                    <Save size={12} /> Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
                  >
                    <X size={12} /> Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between mt-1">
                  <span className="text-gray-700">
                    ₦{order.paymentMade?.toLocaleString() || 0}
                  </span>
                  <button
                    onClick={() => handleEdit(index, order.paymentMade)}
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                  >
                    <Pencil size={12} /> Edit
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
