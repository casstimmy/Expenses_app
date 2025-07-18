export default function VendorPaymentTracker({ orders }) {
    if (!Array.isArray(orders) || orders.length === 0) {
    return <p className="text-gray-500">No vendor orders found.</p>;
  }
  return (
    <>
      {/* Table View for Desktop */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-100 text-gray-700 text-sm">
            <tr>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Vendor</th>
              <th className="px-4 py-2 text-left">Invoice</th>
              <th className="px-4 py-2 text-left">Contact</th>
              <th className="px-4 py-2 text-left">Products</th>
              <th className="px-4 py-2 text-right">Total</th>
              <th className="px-4 py-2 text-right">Paid</th>
              <th className="px-4 py-2 text-left">Pay Date</th>
              <th className="px-4 py-2 text-right">Balance</th>
              <th className="px-4 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white text-sm">
            {orders.map((order) => (
              <tr key={order._id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2">{order.date || "—"}</td>
                <td className="px-4 py-2">{order.supplier || "—"}</td>
                <td className="px-4 py-2">{order.invoiceNumber || "—"}</td>
                <td className="px-4 py-2">{order.contact || "—"}</td>
                <td className="px-4 py-2">
                  {Array.isArray(order.mainProduct)
                    ? order.mainProduct.map((item, idx) => (
                        <div key={idx}>
                          {item.product} x{item.quantity}
                        </div>
                      ))
                    : order.mainProduct || "—"}
                </td>
                <td className="px-4 py-2 text-right">
                  ₦{order.grandTotal?.toLocaleString() || 0}
                </td>
                <td className="px-4 py-2 text-right">
                  ₦{order.paymentMade?.toLocaleString() || 0}
                </td>
                <td className="px-4 py-2">{order.paymentDate || "—"}</td>
                <td className="px-4 py-2 text-right">
                  ₦{order.balance?.toLocaleString() || 0}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      order.status === "Paid"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {order.status || "Pending"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Card View for Mobile */}
      <div className="md:hidden space-y-4 mt-4">
        {orders.map((order) => (
            
          <div
            key={order._id}
            className="bg-white p-4 rounded-xl shadow-md border"
          >
            
            <div className="text-blue-800 font-bold text-lg">
              {order.supplier || "—"}
            </div>
            <div className="text-sm text-gray-500 mb-2">
              Invoice: {order.invoiceNumber || "—"} | {order.date || "No date"}
            </div>

            <div className="text-sm text-gray-700 mb-1">
              <strong>Contact:</strong> {order.contact || "—"}
            </div>
            <div className="text-sm text-gray-700 mb-1">
              <strong>Products:</strong>{" "}
              {Array.isArray(order.mainProduct)
                ? order.mainProduct.map((item, i) => (
                    <span key={i} className="block">
                      {item.product} × {item.quantity}
                    </span>
                  ))
                : order.mainProduct || "—"}
            </div>
            <div className="text-sm mt-2">
              <strong>Total Supplied:</strong>{" "}
              <span className="text-gray-800 font-semibold">
                ₦{order.grandTotal?.toLocaleString() || 0}
              </span>
            </div>
            <div className="text-sm">
              <strong>Paid:</strong>{" "}
              <span className="text-gray-800 font-semibold">
                ₦{order.paymentMade?.toLocaleString() || 0}
              </span>
            </div>
            <div className="text-sm">
              <strong>Balance:</strong>{" "}
              <span className="text-gray-800 font-semibold">
                ₦{order.balance?.toLocaleString() || 0}
              </span>
            </div>
            <div className="text-sm text-gray-700">
              <strong>Payment Date:</strong> {order.paymentDate || "—"}
            </div>
            <div className="mt-2">
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  order.status === "Paid"
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {order.status || "Pending"}
              </span>
            </div>
          </div>
          
        ))}
      </div>
    </>
  );
}
