import { FaCopy, FaEnvelope, FaWhatsapp } from "react-icons/fa";

export default function EndOfDayReport({
  report,
  filters,
  filtersApplied,
  isMatchByDateAndOrLocation,
  copyReportToClipboard,
  shareViaWhatsApp,
  reportError,
}) {
  if (!report)
    return (
      <div className="bg-white shadow-md p-6 rounded-xl text-center text-gray-500 border border-gray-200">
        {reportError || "Select a date and location to view report."}
      </div>
    );

  // Filter & sort payments
  const filteredPayments = report.payments
    .filter((p) => {
      const amount = Number(p.amount);
      const date = p.date || report.date;
      const location = p.location || report.location;

      return (
        isMatchByDateAndOrLocation(date, location) &&
        (!filtersApplied ||
          ((!filters.minAmount || amount >= +filters.minAmount) &&
            (!filters.maxAmount || amount <= +filters.maxAmount) &&
            (!filters.startDate || new Date(date) >= new Date(filters.startDate)) &&
            (!filters.endDate || new Date(date) <= new Date(filters.endDate))))
      );
    })
    .sort(
      (a, b) =>
        new Date(b.date || report.date) - new Date(a.date || report.date)
    );

  const filteredTotalPayments = filteredPayments.reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0
  );

  const formatCurrency = (v) => (v ? v.toLocaleString() : "0");

  return (
    <div className="bg-white shadow-xl p-6 rounded-2xl border border-blue-100 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-blue-800">📊 End of Day Report</h2>
        <p className="text-gray-600 text-sm">
          <span className="font-medium">Date:</span>{" "}
          {new Date(report.date).toLocaleDateString("en-GB")} &nbsp;|&nbsp;
          <span className="font-medium">Location:</span> {report.location}
        </p>
      </div>

      {/* Summary Table */}
      <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
        <thead className="bg-blue-50 text-blue-800 text-sm uppercase">
          <tr>
            <th className="px-4 py-3 text-left">Metric</th>
            <th className="px-4 py-3 text-right">Amount (₦)</th>
          </tr>
        </thead>
        <tbody className="text-gray-800 text-sm divide-y divide-gray-200">
          <tr>
            <td className="px-4 py-2 font-medium">Cash B/F (Prev. Day)</td>
            <td className="px-4 py-2 text-right">{formatCurrency(report.cashBroughtForward)}</td>
          </tr>
          <tr>
            <td className="px-4 py-2 font-medium">Cash Received</td>
            <td className="px-4 py-2 text-right">{formatCurrency(report.cashToday)}</td>
          </tr>
          <tr>
            <td className="px-4 py-2 font-medium">Total Cash Available</td>
            <td className="px-4 py-2 text-right font-semibold text-blue-700">
              {formatCurrency(report.cashBroughtForward + report.cashToday)}
            </td>
          </tr>
          <tr>
            <td className="px-4 py-2 font-medium">Total Payments</td>
            <td className="px-4 py-2 text-right text-red-600">
              -{formatCurrency(report.totalPayments)}
            </td>
          </tr>
          <tr>
            <td className="px-4 py-2 font-bold text-green-700">Cash at Hand</td>
            <td
              className={`px-4 py-2 text-right font-bold ${
                report.cashAtHand < 0 ? "text-red-600" : "text-green-700"
              }`}
            >
              {formatCurrency(report.cashAtHand)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Payment Breakdown */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">💸 Payments</h3>
        {filteredPayments.length > 0 ? (
          <ul className="divide-y divide-gray-100 text-sm text-gray-700 border border-gray-200 rounded-lg overflow-hidden">
            {filteredPayments.map((p, idx) => (
              <li key={idx} className="flex justify-between px-4 py-2 bg-gray-50 hover:bg-gray-100">
                <span>
                  {p.title}
                  <span className="ml-2 text-gray-400 text-xs">
                    {new Date(p.date || report.date).toLocaleDateString()}
                  </span>
                </span>
                <span>₦{formatCurrency(p.amount)}</span>
              </li>
            ))}
            <li className="flex justify-between font-semibold px-4 py-2 bg-gray-200">
              <span>Total</span>
              <span>₦{formatCurrency(filteredTotalPayments)}</span>
            </li>
          </ul>
        ) : (
          <p className="text-sm text-gray-500 italic">No payments for this date.</p>
        )}
      </div>

      {/* Staff + Actions */}
      <div className="flex justify-between gap-8 items-center border-t pt-4 mt-4 border-gray-200">
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">👥 Staff on Duty</h3>
          {report.staff?.name ? (
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {report.staff.name}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No staff recorded.</p>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={() => copyReportToClipboard(report)}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg border border-blue-400 bg-white text-blue-600 text-sm font-medium hover:bg-blue-500 hover:text-white"
          >
            <FaCopy className="w-4 h-4" />
            Copy
          </button>
          <button
            onClick={() => shareViaWhatsApp(report)}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg border border-green-400 bg-white text-green-600 text-sm font-medium hover:bg-green-500 hover:text-white"
          >
            <FaWhatsapp className="w-4 h-4" />
            WhatsApp
          </button>
          <a
            href={`mailto:?subject=End of Day Report - ${new Date(report.date).toLocaleDateString(
              "en-GB"
            )}&body=${encodeURIComponent(
              `End of Day Report\nDate: ${new Date(report.date).toLocaleDateString("en-GB")}\nLocation: ${report.location}`
            )}`}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg border border-gray-400 bg-white text-gray-700 text-sm font-medium hover:bg-gray-600 hover:text-white"
          >
            <FaEnvelope className="w-4 h-4" />
            Email
          </a>
        </div>
      </div>
    </div>
  );
}