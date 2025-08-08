import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { Trash2, Pencil, Save, X } from "lucide-react";
import Link from "next/link";

export default function VendorPaymentTracker({ orders: initialOrders }) {
  const [orders, setOrders] = useState(
    (initialOrders || []).filter((order) => order.reason === "Stock Received")
  );
  const [editIndex, setEditIndex] = useState(null);
  const [editedPayment, setEditedPayment] = useState("");
  const [selectedVendor, setSelectedVendor] = useState("");
  const [vendors, setVendors] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const scrollRef = useRef(null);
  const [editedTotal, setEditedTotal] = useState("");
  const [editedDate, setEditedDate] = useState("");

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
    const currentOrder = orders[index];
    setEditIndex(index);
    setEditedPayment(currentPayment || "");
    setEditedTotal(currentOrder.grandTotal || "");
    setEditedDate(
      currentOrder.date ? format(new Date(currentOrder.date), "yyyy-MM-dd") : ""
    );
  };

  const handleCancel = () => {
    setEditIndex(null);
    setEditedPayment("");
  };

  const handleDelete = async (orderId) => {
    const confirm = window.confirm(
      "Are you sure you want to delete this order?"
    );
    if (!confirm) return;

    try {
      const res = await fetch(`/api/payments/${orderId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        // Refresh or filter out the deleted order from state
        setOrders((prev) => prev.filter((o) => o._id !== orderId));
      } else {
        alert("Failed to delete order");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("An error occurred while deleting.");
    }
  };

 const handleSave = async (index) => {
  const updatedOrders = [...orders];
  const payment = Number(editedPayment) || 0;
  const grandTotal = Number(editedTotal) || 0;
  const currentDate = editedDate || format(new Date(), "yyyy-MM-dd");

  const balance = grandTotal - payment;
  const status =
    payment === 0
      ? "Not Paid"
      : payment < grandTotal
      ? "Partly Paid"
      : payment === grandTotal
      ? "Paid"
      : "Credit";

  // Merge updated fields into the order
  const updatedOrder = {
    ...updatedOrders[index],
    paymentMade: payment,
    date: currentDate,
    grandTotal,
    balance,
    status,
  };

  updatedOrders[index] = updatedOrder;

  setOrders(updatedOrders);
  setEditIndex(null);
  setEditedPayment("");
  setEditedTotal("");
  setEditedDate("");

  try {
    const response = await fetch(`/api/payments/${updatedOrder._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedOrder), // ✅ Send full updated order
    });

    if (!response.ok) {
      throw new Error("Failed to update order");
    }
  } catch (error) {
    console.error("Payment update failed", error);
  }
};


  if (!filteredOrders.length) {
    return <p className="text-gray-500">No vendor orders found.</p>;
  }

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Speed factor
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="space-y-8">
      {/* Desktop Table */}
      <div
        className="hidden md:block bg-white rounded-xl shadow overflow-x-auto"
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      >
        <table className="min-w-full divide-y divide-gray-300 text-sm select-none">
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
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filteredOrders.map((order, index) => (
              <tr key={order._id} className="hover:bg-gray-50 transition">
                {/* Order Date Editable */}
                <td className="px-4 py-3">
                  {editIndex === index ? (
                    <input
                      type="date"
                      className="border border-gray-300 px-2 py-1 rounded text-sm"
                      value={editedDate}
                      onChange={(e) => setEditedDate(e.target.value)}
                    />
                  ) : (
                    <span>
                      {order.date
                        ? format(new Date(order.date), "dd MMM yyyy")
                        : "—"}
                    </span>
                  )}
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
                <td className="px-4 py-3 text-right">
                  {editIndex === index ? (
                    <input
                      type="number"
                      className="w-24 border border-gray-300 px-2 py-1 rounded text-sm text-right"
                      value={editedTotal}
                      onChange={(e) => setEditedTotal(e.target.value)}
                    />
                  ) : (
                    `₦${order.grandTotal?.toLocaleString() || 0}`
                  )}
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
                        : order.status === "Credit"
                        ? "bg-blue-100 text-blue-800"
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
                      className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-md shadow hover:bg-blue-700 transition"
                    >
                      Memo
                    </a>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleDelete(order._id)}
                    className="inline-flex items-center gap-1 bg-red-100 text-red-600 text-sm font-medium px-3 py-2 rounded-md shadow hover:bg-red-200 hover:text-red-700 transition"
                  >
                    Delete
                  </button>
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
            className="bg-white p-4 rounded-2xl shadow border border-gray-200 space-y-4"
          >
            {/* Header */}
            <div className="flex justify-between items-start">
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
                  className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded-md hover:bg-blue-600 transition"
                >
                  View Memo
                </a>
              </Link>
            </div>

            {/* Contact */}
            <div className="text-sm text-gray-600">
              <strong>Contact:</strong> {order.contact || "—"}
            </div>

            {/* Products */}
            <div className="text-sm">
              <strong>Products:</strong>
              <div className="pl-2 mt-1 space-y-1">
                {Array.isArray(order.mainProduct) ? (
                  order.mainProduct.map((p, i) => (
                    <div key={i} className="text-gray-700">
                      {p.product} × {p.quantity}
                    </div>
                  ))
                ) : (
                  <div>{order.mainProduct || "—"}</div>
                )}
              </div>
            </div>

            {/* Payment Info */}
            <div className="grid grid-cols-2 gap-3 text-sm text-gray-700 border-t border-gray-100 pt-3">
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
            <div className="text-sm">
              <strong>Paid:</strong>
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

            {/* Delete Button */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => handleDelete(order._id)}
                className="flex items-center gap-1 bg-red-600 text-white px-4 py-1.5 rounded text-sm hover:bg-red-700 transition"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
