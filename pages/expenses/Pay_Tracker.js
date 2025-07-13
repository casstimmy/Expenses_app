import Layout from "@/components/Layout";

export default function PayTracker() {
  const orders = [
    {
      date: "02 June 2025",
      vendor: "Coke Person Abike",
      invoiceName: "Omidun & Kemfun",
      invoiceNumber: "On Delivery",
      contact: "0703 028 1043",
      products: "Coke Products",
      totalSupplied: 500000,
      delivered: "Yes",
      paymentMade: 500000,
      paymentDate: "02 June 2025",
      balance: 0,
      status: "Fully Paid",
    },
    {
      vendor: "Existing Existence Of God",
      invoiceName: "Betty Distribution",
      invoiceNumber: "On Delivery",
      contact: "0706 721 4781",
      products: "Spaghetti, Ayoola Poundo",
      totalSupplied: 669300,
      delivered: "Yes",
      paymentMade: 669300,
      paymentDate: "02 June 2025",
      balance: 0,
      status: "Fully Paid",
    },
    {
      vendor: "Bd & T Ltd",
      invoiceName: "Bd & T Ltd",
      invoiceNumber: "1914/1913/New Order",
      contact: "0803 581 5950",
      products: "Fun Snax and Biscuits",
      totalSupplied: 171900,
      delivered: "Yes",
      paymentMade: 171900,
      paymentDate: "02 June 2025",
      balance: 0,
      status: "Fully Paid",
    },
    {
      vendor: "Madam Oyin",
      invoiceName: "Trade Depot",
      invoiceNumber: "01-22023...",
      contact: "0706 721 4781",
      products: "Whole Sale",
      totalSupplied: 217700,
      delivered: "Yes",
      paymentMade: 217700,
      paymentDate: "02 June 2025",
      balance: 0,
      status: "Fully Paid",
    },
    {
      vendor: "Kilishi Person",
      invoiceName: "Henley and Ascot Ltd",
      invoiceNumber: "15195",
      contact: "0808 755 1676",
      products: "Kilishi Products",
      totalSupplied: 190200,
      delivered: "Yes",
      paymentMade: 190200,
      paymentDate: "02 June 2025",
      balance: 0,
      status: "Fully Paid",
    },
  ];

  const total = orders.reduce((sum, order) => sum + order.totalSupplied, 0);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-blue-800 mb-6">
            Vendor Order Pay Tracker - June 2025
          </h1>
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-blue-100 text-gray-700 text-sm">
                <tr>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Vendor</th>
                  <th className="px-4 py-2 text-left">Name on Invoice</th>
                  <th className="px-4 py-2 text-left">Invoice Number</th>
                  <th className="px-4 py-2 text-left">Contact</th>
                  <th className="px-4 py-2 text-left">Products</th>
                  <th className="px-4 py-2 text-right">Total Supplied</th>
                  <th className="px-4 py-2 text-center">Delivered</th>
                  <th className="px-4 py-2 text-right">Payment Made</th>
                  <th className="px-4 py-2 text-left">Payment Date</th>
                  <th className="px-4 py-2 text-right">Balance</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white text-sm">
                {orders.map((order, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-4 py-2 whitespace-nowrap">{order.date || "-"}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{order.vendor}</td>
                    <td className="px-4 py-2">{order.invoiceName}</td>
                    <td className="px-4 py-2">{order.invoiceNumber}</td>
                    <td className="px-4 py-2">{order.contact}</td>
                    <td className="px-4 py-2">{order.products}</td>
                    <td className="px-4 py-2 text-right">₦ {order.totalSupplied.toLocaleString()}</td>
                    <td className="px-4 py-2 text-center">{order.delivered}</td>
                    <td className="px-4 py-2 text-right">₦ {order.paymentMade.toLocaleString()}</td>
                    <td className="px-4 py-2">{order.paymentDate}</td>
                    <td className="px-4 py-2 text-right">₦ {order.balance.toLocaleString()}</td>
                    <td className="px-4 py-2 text-green-700 font-semibold">{order.status}</td>
                  </tr>
                ))}
                <tr className="bg-gray-100 font-bold border-t">
                  <td colSpan="6" className="px-4 py-3 text-right">Total For June</td>
                  <td className="px-4 py-3 text-right">₦ {total.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">—</td>
                  <td className="px-4 py-3 text-right">₦ {total.toLocaleString()}</td>
                  <td className="px-4 py-3">—</td>
                  <td className="px-4 py-3 text-right">₦ 0</td>
                  <td className="px-4 py-3 text-green-700">Fully Paid</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
