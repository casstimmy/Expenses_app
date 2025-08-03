import OrderTracker from "./OrderTracker";
import { useState, useEffect, useRef } from "react";

export default function OrderList({
  submittedOrders,
  setSubmittedOrders,
  selectedOrder,
  setSelectedOrder,
  staff,
}) {
  const [editingProductIndex, setEditingProductIndex] = useState(null);
  const orderDetailsRef = useRef(null);

  const filteredOrders = Array.isArray(submittedOrders)
    ? submittedOrders.filter((order) => order.reason !== "Stock Received")
    : [];

  const handleDeleteOrder = async (deletedId) => {
    try {
      const res = await fetch(`/api/stock-orders/${deletedId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      // Update list directly
      setSubmittedOrders((prev) => prev.filter((o) => o._id !== deletedId));
      setSelectedOrder(null);
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete order. Please try again.");
    }
  };



  return (
    <section className="bg-white p-6 rounded shadow">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Submitted Stock Orders
      </h2>

      {/* ✅ Card View for Mobile */}
      <div className="md:hidden space-y-4">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order, idx) => (
            <div
              key={idx}
              className="border rounded-lg p-4 shadow-sm bg-gray-50"
            >
              <p className="text-sm mb-1">
                <span className="font-medium">Order Date:</span>{" "}
                {order.date
                  ? new Date(order.date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
              </p>
              <p className="text-sm mb-1">
                <span className="font-medium">Vendor:</span> {order.supplier}
              </p>
              <p className="text-sm mb-1">
                <span className="font-medium">Contact:</span> {order.contact}
              </p>
              <p className="text-sm mb-1">
                <span className="font-medium">Main Product:</span>{" "}
                {order.mainProduct}
              </p>
              <p className="text-sm mb-1">
                <span className="font-medium">Products:</span>{" "}
                {order.products.length}
              </p>
              <p className="text-sm mb-2">
                <span className="font-medium">Total:</span> ₦
                {parseFloat(order.grandTotal).toLocaleString()}
              </p>
              <div className="flex flex-col gap-2 px-3 py-2 text-center">
                <button
                  onClick={() => {
                    setSelectedOrder(order);
                    setTimeout(() => {
                      orderDetailsRef.current?.scrollIntoView({
                        behavior: "smooth",
                      });
                    }, 100);
                  }}
                  className="w-full text-sm font-semibold text-blue-600 border border-blue-600 rounded px-4 py-2 hover:bg-blue-600 hover:text-white transition-all duration-150"
                >
                  View Order
                </button>
                <button
                  onClick={() => handleDeleteOrder(order._id)}
                  className="w-full text-sm font-semibold text-red-600 border border-red-600 rounded px-4 py-2 hover:bg-red-600 hover:text-white transition-all duration-150"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">No orders found.</p>
        )}
      </div>

      {/* ✅ Table View for Desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="text-left px-3 py-2">Order Date</th>
              <th className="text-left px-3 py-2">Vendor</th>
              <th className="text-left px-3 py-2">Contact</th>
              <th className="text-left px-3 py-2">Main Product</th>
              <th className="text-left px-3 py-2">Products</th>
              <th className="text-right px-3 py-2">Total</th>
              <th className="text-center px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order, idx) => (
                <tr key={idx} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {order.date
                      ? new Date(order.date).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="px-3 py-2">{order.supplier}</td>
                  <td className="px-3 py-2">{order.contact}</td>
                  <td className="px-3 py-2">{order.mainProduct}</td>
                  <td className="px-3 py-2">{order.products.length}</td>
                  <td className="px-3 py-2 text-right">
                    ₦{parseFloat(order.grandTotal).toLocaleString()}
                  </td>
                  <td className="flex gap-2 px-3 py-2 text-center">
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setTimeout(() => {
                          orderDetailsRef.current?.scrollIntoView({
                            behavior: "smooth",
                          });
                        }, 100);
                      }}
                      className="inline-block text-xs font-semibold text-blue-600 border border-blue-600 rounded px-4 py-[6px] hover:bg-blue-600 hover:text-white transition-all duration-150 w-28 text-center"
                    >
                      View Order
                    </button>

                    <button
                      onClick={() => handleDeleteOrder(order._id)}
                      className="inline-block text-xs font-semibold text-red-600 border border-red-600 rounded px-4 py-[6px] hover:bg-red-600 hover:text-white transition-all duration-150 w-28 text-center"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-4 text-gray-500">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ Order Detail View */}
      {selectedOrder && (
        <div className="mt-6" ref={orderDetailsRef}>
          <OrderTracker
            order={selectedOrder}
            setOrder={setSelectedOrder}
            editingIndex={editingProductIndex}
            setEditingIndex={setEditingProductIndex}
            onDeleteOrder={handleDeleteOrder}
            staff={staff._id}
            setSubmittedOrders={setSubmittedOrders} // ✅ add this if needed
          />

          <div className="text-right border-t border-gray-300 pt-4 mt-5">
            <button
              onClick={() => setSelectedOrder(null)}
              className="px-4 py-1.5 text-sm font-medium text-red-600 border border-red-300 rounded-md hover:bg-red-200 transition duration-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
