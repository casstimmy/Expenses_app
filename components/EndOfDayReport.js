import { useState } from "react";
import { FaCopy, FaEnvelope, FaWhatsapp, FaPrint, FaCashRegister } from "react-icons/fa";
import { printContent } from "./PrinterSettings";

export default function EndOfDayReport({
  report,
  filters,
  filtersApplied,
  isMatchByDateAndOrLocation,
  copyReportToClipboard,
  shareViaWhatsApp,
  reportError,
}) {
  const [showCloseTill, setShowCloseTill] = useState(false);
  const [tillClosed, setTillClosed] = useState(false);

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

  const handlePrintEOD = () => {
    const paymentRows = filteredPayments
      .map(
        (p) =>
          `<tr><td>${p.title}</td><td class="text-right">${Number(p.amount || 0).toLocaleString()}</td></tr>`
      )
      .join("");

    const html = `
      <div class="header">
        <img src="/image/LogoName.png" alt="BizSuits Logo" />
        <h2>End of Day Report</h2>
        <p>${new Date(report.date).toLocaleDateString("en-GB")} | ${report.location}</p>
      </div>
      <div class="divider"></div>
      <table>
        <tr><td>Cash B/F (Prev. Day)</td><td class="text-right">₦${formatCurrency(report.cashBroughtForward)}</td></tr>
        <tr><td>Cash Received</td><td class="text-right">₦${formatCurrency(report.cashToday)}</td></tr>
        <tr><td class="font-bold">Total Cash Available</td><td class="text-right font-bold">₦${formatCurrency(report.cashBroughtForward + report.cashToday)}</td></tr>
        <tr><td>Total Payments</td><td class="text-right text-red">-₦${formatCurrency(report.totalPayments)}</td></tr>
        <tr><td class="font-bold ${report.cashAtHand < 0 ? "text-red" : "text-green"}">Cash at Hand</td><td class="text-right font-bold ${report.cashAtHand < 0 ? "text-red" : "text-green"}">₦${formatCurrency(report.cashAtHand)}</td></tr>
      </table>
      ${
        filteredPayments.length > 0
          ? `
        <div class="divider"></div>
        <h3 style="font-size:0.9em; margin:6px 0;">Payments</h3>
        <table>
          ${paymentRows}
          <tr class="font-bold"><td>Total</td><td class="text-right">₦${formatCurrency(filteredTotalPayments)}</td></tr>
        </table>
      `
          : ""
      }
      ${report.staff?.name ? `<div class="divider"></div><p>Staff on Duty: <strong>${report.staff.name}</strong></p>` : ""}
      <div class="footer">
        <p>Ibile Trading Resources Ltd.</p>
        <p>Thank you for your service today!</p>
      </div>
    `;

    printContent(html, `EOD Report - ${new Date(report.date).toLocaleDateString("en-GB")}`);
  };

  const handleCloseTill = () => {
    setTillClosed(true);
    setShowCloseTill(false);
    // Print EOD automatically on close till
    handlePrintEOD();
  };

  return (
    <div className="bg-white shadow-xl p-6 rounded-2xl border border-blue-100 space-y-6">
      {/* Header with Logo */}
      <div className="flex items-start gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/image/LogoName.png" alt="Logo" className="w-20 h-auto object-contain hidden sm:block" />
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-blue-800">📊 End of Day Report</h2>
          <p className="text-gray-600 text-sm">
            <span className="font-medium">Date:</span>{" "}
            {new Date(report.date).toLocaleDateString("en-GB")} &nbsp;|&nbsp;
            <span className="font-medium">Location:</span> {report.location}
          </p>
        </div>
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
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center border-t pt-4 mt-4 border-gray-200">
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

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => copyReportToClipboard(report)}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg border border-blue-400 bg-white text-blue-600 text-sm font-medium hover:bg-blue-500 hover:text-white transition"
          >
            <FaCopy className="w-4 h-4" />
            Copy
          </button>
          <button
            onClick={() => shareViaWhatsApp(report)}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg border border-green-400 bg-white text-green-600 text-sm font-medium hover:bg-green-500 hover:text-white transition"
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
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg border border-gray-400 bg-white text-gray-700 text-sm font-medium hover:bg-gray-600 hover:text-white transition"
          >
            <FaEnvelope className="w-4 h-4" />
            Email
          </a>
          <button
            onClick={handlePrintEOD}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg border border-purple-400 bg-white text-purple-600 text-sm font-medium hover:bg-purple-500 hover:text-white transition"
          >
            <FaPrint className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      {/* Close Till */}
      <div className="border-t border-gray-200 pt-4">
        {tillClosed ? (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-medium">
            <FaCashRegister className="w-4 h-4" />
            Till closed for {new Date(report.date).toLocaleDateString("en-GB")} at {report.location}. EOD report has been printed.
          </div>
        ) : (
          <>
            {!showCloseTill ? (
              <button
                onClick={() => setShowCloseTill(true)}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition text-sm font-semibold shadow-md"
              >
                <FaCashRegister className="w-4 h-4" />
                Close Till
              </button>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                <p className="text-sm text-red-800 font-medium">
                  Are you sure you want to close the till for{" "}
                  <strong>{new Date(report.date).toLocaleDateString("en-GB")}</strong> at{" "}
                  <strong>{report.location}</strong>?
                </p>
                <p className="text-xs text-red-600">
                  This will print the End of Day report with all details.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleCloseTill}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
                  >
                    Yes, Close Till
                  </button>
                  <button
                    onClick={() => setShowCloseTill(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}