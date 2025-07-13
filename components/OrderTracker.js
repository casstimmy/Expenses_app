export default function StockOrderTable({ order }) {
  if (!order) return null;

  return (
    <div className="mt-6 bg-white p-4 rounded shadow">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Order Details for: {order.supplier}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-700 mb-4">
        <p><strong>Date:</strong> {order.date}</p>
        <p><strong>Supplier:</strong> {order.supplier}</p>
        <p><strong>Contact:</strong> {order.contact}</p>
      </div>

      <table className="w-full text-sm bg-gray-50 rounded">
        <thead>
          <tr className="bg-gray-200">
            <th className="text-left px-3 py-2">Product</th>
            <th className="text-right px-3 py-2">Qty</th>
            <th className="text-right px-3 py-2">Unit Cost</th>
            <th className="text-right px-3 py-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {order.products.map((item, i) => (
            <tr key={i} className="border-t">
              <td className="px-3 py-2">{item.product}</td>
              <td className="px-3 py-2 text-right">{item.quantity}</td>
              <td className="px-3 py-2 text-right">
                ₦{parseFloat(item.costPerUnit).toLocaleString()}
              </td>
              <td className="px-3 py-2 text-right">
                ₦{parseFloat(item.total).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="text-right mt-4 font-semibold text-blue-700">
        Grand Total: ₦{parseFloat(order.grandTotal).toLocaleString()}
      </div>
    </div>
  );
}
