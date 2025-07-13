import StockOrderTable from "./OrderTracker";


export default function OrderList({ submittedOrders, selectedOrder, setSelectedOrder }) {
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
            {submittedOrders.map((order, idx) => (
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
                    onClick={() => setSelectedOrder(order)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 border-2 hover:text-white hover:bg-blue-400 px-3 py-2 rounded transition"
                  >
                    View Order
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <div className="mt-6">
          <StockOrderTable order={selectedOrder} />
          <div className="text-right mt-2">
            <button
              onClick={() => setSelectedOrder(null)}
              className="text-sm text-red-500 hover:underline"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
