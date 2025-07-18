import OrderTracker from "./OrderTracker";
import { useState, useEffect, useRef } from "react";

export default function OrderList({
  submittedOrders,
  selectedOrder,
  setSelectedOrder,
  staff,
}) {
  const [editingProductIndex, setEditingProductIndex] = useState(null);
  const [orders, setOrders] = useState([]);
  const orderDetailsRef = useRef(null);

  // Initialize local orders list when component mounts or when submittedOrders change
  useEffect(() => {
    setOrders(submittedOrders);
  }, [submittedOrders]);

  const handleDeleteOrder = (deletedId) => {
    setOrders((prev) => prev.filter((o) => o._id !== deletedId));
    setSelectedOrder(null); 
  };

  return (
    <section className="bg-white p-6 rounded shadow">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Submitted Stock Orders
      </h2>

      <div className="overflow-x-auto">
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
  {Array.isArray(orders) && orders.length > 0 ? (
    orders.map((order, idx) => (
      <tr key={idx} className="border-t hover:bg-gray-50">
        <td className="px-3 py-2">{order.date}</td>
        <td className="px-3 py-2">{order.supplier}</td>
        <td className="px-3 py-2">{order.contact}</td>
        <td className="px-3 py-2">{order.mainProduct}</td>
        <td className="px-3 py-2">{order.products.length}</td>
        <td className="px-3 py-2 text-right">
          ₦{parseFloat(order.grandTotal).toLocaleString()}
        </td>
        <td className="px-3 py-2 text-center">
          <button
            onClick={() => {
              setSelectedOrder(order);
              setTimeout(() => {
                orderDetailsRef.current?.scrollIntoView({ behavior: "smooth" });
              }, 100);
            }}
            className="inline-block text-xs font-semibold text-blue-600 border border-blue-600 rounded px-4 py-[6px] hover:bg-blue-600 hover:text-white transition-all duration-150 w-28 text-center"
          >
            View Order
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

      {selectedOrder && (
        <div className="mt-6" ref={orderDetailsRef}>
          <OrderTracker
            order={selectedOrder}
            setOrder={setSelectedOrder}
            editingIndex={editingProductIndex}
            setEditingIndex={setEditingProductIndex}
            onDeleteOrder={handleDeleteOrder}
            staff={staff}
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
