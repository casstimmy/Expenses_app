import Layout from "@/components/Layout";
import {
  FaFilePdf,
  FaFileExcel,
  FaCopy,
  FaWhatsapp,
  FaEnvelope,
  FaSyncAlt,
} from "react-icons/fa";
import { useEffect, useState } from "react";
import ExportToPDF from "@/components/ExportToPDF";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { BarChart2, PieChart as PieIcon } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = [
  "#3B82F6",
  "#60A5FA",
  "#93C5FD",
  "#1E3A8A",
  "#2563EB",
  "#1D4ED8",
  "#60A5FA",
];

const LOCATIONS = ["Ibile 1", "Ibile 2"];

export default function ExpenseAnalysis() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showBarChart, setShowBarChart] = useState(false);
  const [dailyCashRecords, setDailyCashRecords] = useState([]);
  const [report, setReport] = useState(null);
  const [reportError, setReportError] = useState("");
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [reportsByStore, setReportsByStore] = useState({
    "Ibile 1": null,
    "Ibile 2": null,
  });

  const [filters, setFilters] = useState({
    category: "",
    minAmount: "",
    maxAmount: "",
    startDate: "",
    endDate: "",
    location: "",
  });

  const resetFilters = () => {
    setSelectedDate(todayStr);
    setSelectedLocation("");
    setFilters({
      category: "",
      minAmount: "",
      maxAmount: "",
      startDate: "",
      endDate: "",
      location: "",
    });
    setFiltersApplied(false);
    setReport(null);
  };

  useEffect(() => {
    const loadData = async () => {
      const localExpenses = localStorage.getItem("expenses");
      const localCash = localStorage.getItem("dailyCashRecords");

      if (localExpenses && localCash) {
        try {
          setExpenses(JSON.parse(localExpenses));
          setDailyCashRecords(JSON.parse(localCash));
        } catch (err) {
          console.error("Failed to parse localStorage data", err);
        }
      } else {
        try {
          const [expenseRes, cashRes] = await Promise.all([
            fetch("/api/expenses"),
            fetch("/api/daily-cash"),
          ]);

          const [expenseData, cashData] = await Promise.all([
            expenseRes.json(),
            cashRes.json(),
          ]);

          if (expenseRes.ok) {
            setExpenses(expenseData);
            localStorage.setItem("expenses", JSON.stringify(expenseData));
          }

          if (cashRes.ok) {
            setDailyCashRecords(cashData);
            localStorage.setItem("dailyCashRecords", JSON.stringify(cashData));
          }
        } catch (err) {
          console.error("Error fetching expenses or daily cash:", err);
        }
      }

      const locations = ["Ibile 1", "Ibile 2"];
      for (const location of locations) {
        try {
          const res = await fetch(
            `/api/daily-cash/report?date=${selectedDate}&location=${encodeURIComponent(
              location
            )}`
          );
          const data = await res.json();

          if (res.ok && !data?.error) {
            setReportsByStore((prev) => ({
              ...prev,
              [location]: data,
            }));
            if (location === selectedLocation) {
              setReport(data);
              setReportError("");
            }
          } else if (location === selectedLocation) {
            setReport(null);
            setReportError(data?.error || "Error fetching report");
          }
        } catch (err) {
          if (location === selectedLocation) {
            setReport(null);
            setReportError("Network error");
          }
          console.error("Failed to fetch report for:", location, err);
        }
      }

      setLoading(false);
    };

    loadData();
  }, [selectedDate, selectedLocation]);

  const isMatchByDateAndOrLocation = (recordDate, recordLocation) => {
    const dateOnly = new Date(recordDate).toISOString().split("T")[0];
    const matchesDate = !selectedDate || dateOnly === selectedDate;
    const matchesLocation =
      !selectedLocation ||
      (recordLocation &&
        recordLocation.toLowerCase().includes(selectedLocation.toLowerCase()));
    return matchesDate && matchesLocation;
  };

  const applyFilters = (expense) => {
    const { category, minAmount, maxAmount, startDate, endDate, location } =
      filters;
    const amount = Number(expense.amount);
    const date = new Date(expense.createdAt);
    return (
      (!category || expense.category?.name === category) &&
      (!location ||
        (expense.location &&
          expense.location.toLowerCase().includes(location.toLowerCase()))) &&
      (!minAmount || amount >= Number(minAmount)) &&
      (!maxAmount || amount <= Number(maxAmount)) &&
      (!startDate || date >= new Date(startDate)) &&
      (!endDate || date <= new Date(endDate))
    );
  };

  const filteredDailyCash = dailyCashRecords.filter(
    (record) =>
      !selectedLocation ||
      (record.location &&
        record.location.toLowerCase().includes(selectedLocation.toLowerCase()))
  );

  const filteredExpenses = expenses
    .filter((exp) => isMatchByDateAndOrLocation(exp.createdAt, exp.location))
    .filter(applyFilters);

  const totalCashReceived = dailyCashRecords
    .filter((r) => {
      const recordDate = new Date(r.date).toISOString().split("T")[0];
      const matchesDate = recordDate === selectedDate;
      const matchesLocation =
        !selectedLocation ||
        (r.location &&
          r.location.toLowerCase().includes(selectedLocation.toLowerCase()));
      return matchesDate && matchesLocation;
    })
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);

  const totalExpenses = expenses
    .filter((r) => {
      const recordDate = new Date(r.createdAt).toISOString().split("T")[0];
      const matchesDate = recordDate === selectedDate;
      const matchesLocation =
        !selectedLocation ||
        (r.location &&
          r.location.toLowerCase().includes(selectedLocation.toLowerCase()));
      return matchesDate && matchesLocation;
    })
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);

  const expensesByCategory = filteredExpenses.reduce((acc, curr) => {
    const catName = curr.category?.name || "Uncategorized";
    acc[catName] = (acc[catName] || 0) + Number(curr.amount);
    return acc;
  }, {});

  const chartData = Object.entries(expensesByCategory).map(
    ([category, amount]) => ({ category, amount })
  );

  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    const dateA = a.date ? new Date(a.date) : null;
    const dateB = b.date ? new Date(b.date) : null;

    if (!dateA || isNaN(dateA)) return 1;
    if (!dateB || isNaN(dateB)) return -1;

    return dateB - dateA; // descending
  });

  const totalCashAtHand = selectedLocation
    ? reportsByStore[selectedLocation]?.cashAtHand || 0
    : (reportsByStore["Ibile 1"]?.cashAtHand || 0) +
      (reportsByStore["Ibile 2"]?.cashAtHand || 0);

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredExpenses);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "Expense_Report.xlsx");
  };

  const shareViaWhatsApp = (report) => {
    const message = `📊 End of Day Report
Date: ${new Date(report.date).toLocaleDateString("en-GB")}
Location: ${report.location}

--- SUMMARY ---
• Cash B/F: ₦${Number(report.cashBroughtForward || 0).toLocaleString()}
• Cash Received: ₦${Number(report.cashToday || 0).toLocaleString()}
• Total Available: ₦${Number(report.totalCashAvailable || 0).toLocaleString()}
• Total Payments: -₦${Number(report.totalPayments || 0).toLocaleString()}
• Cash at Hand: ₦${Number(report.cashAtHand || 0).toLocaleString()}

--- PAYMENTS ---
${report.payments
  .map(
    (p) =>
      `• ${p.title} (${new Date(p.date || report.date).toLocaleDateString(
        "en-GB"
      )}): ₦${Number(p.amount).toLocaleString()}`
  )
  .join("\n")}
Total Payments: ₦${Number(report.totalPayments || 0).toLocaleString()}

👥 Staff on Duty: ${report.staff?.name || "N/A"}`;

    const whatsappURL = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappURL, "_blank");
  };

  function copyReportToClipboard(report) {
    if (!report) return;

    let text = `📊 End of Day Report\n`;
    text += `Date: ${new Date(report.date).toLocaleDateString("en-GB")}\n`;
    text += `Location: ${report.location}\n\n`;

    text += `--- SUMMARY ---\n`;
    text += `• Cash B/F: ₦${report.cashBroughtForward.toLocaleString()}\n`;
    text += `• Cash Received: ₦${report.cashToday.toLocaleString()}\n`;
    text += `• Total Available: ₦${report.totalCashAvailable.toLocaleString()}\n`;
    text += `• Total Payments: -₦${report.totalPayments.toLocaleString()}\n`;
    text += `• Cash at Hand: ₦${report.cashAtHand.toLocaleString()}\n\n`;

    if (report.payments?.length) {
      text += `--- PAYMENTS ---\n`;
      report.payments.forEach((p) => {
        text += `• ${p.title} (${new Date(
          p.date || report.date
        ).toLocaleDateString("en-GB")}): ₦${Number(
          p.amount
        ).toLocaleString()}\n`;
      });
      const total = report.payments.reduce(
        (sum, p) => sum + Number(p.amount || 0),
        0
      );
      text += `Total Payments: ₦${total.toLocaleString()}\n\n`;
    } else {
      text += `No payment records for this date.\n\n`;
    }

    if (report.staff?.name) {
      text += `👥 Staff on Duty: ${report.staff.name}\n`;
    } else {
      text += `No staff recorded for this date.\n`;
    }

    navigator.clipboard.writeText(text).then(() => {
      alert("Report copied to clipboard!");
    });
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-row justify-between algin-start">
            <div>
              <h1 className="text-3xl font-bold text-blue-800 mb-6">
                Dashboard
              </h1>
              <p className="text-gray-600 text-lg mt-1">
                Visualize and monitor your business expenditures in one place.
              </p>
            </div>

            <button
              onClick={() => {
                setIsRefreshing(true); // trigger loading state
                localStorage.removeItem("expenses");
                localStorage.removeItem("dailyCashRecords");
                window.location.reload(); // re-fetch data
              }}
              className={`text-xs sm:text-sm flex items-center justify-center gap-1 
    bg-blue-500 px-4 py-2 text-white rounded-xl h-10 cursor-pointer 
    hover:bg-white hover:text-blue-500 hover:border-2 hover:border-blue-200 
    transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <>
                  <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4" />
                  <span>Refreshing...</span>
                </>
              ) : (
                <>
                  <FaSyncAlt className="text-lg" />
                  <span className="hidden sm:inline">Refresh Data</span>
                </>
              )}
            </button>
          </div>

          {/* Filter Buttons */}
          <div className="flex items-center justify-between mt-4 mb-2">
            <div className="text-sm text-gray-600">
              {(selectedDate || selectedLocation) && (
                <div className="flex flex-wrap items-center gap-2">
                  <span>Active Filters:</span>
                  {selectedDate && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      Date: {selectedDate}
                    </span>
                  )}
                  {selectedLocation && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                      Location: {selectedLocation}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Reset Button */}
            <button
              onClick={() => {
                const todayStr = new Date().toISOString().split("T")[0];
                setSelectedDate(todayStr);
                setSelectedLocation("");
                setFilters({
                  category: "",
                  minAmount: "",
                  maxAmount: "",
                  startDate: "",
                  endDate: "",
                  location: "",
                });
                setFiltersApplied(false); // Clear filter logic
                setReport(null); // Reset report section
              }}
              className="text-xs bg-red-500 p-2 text-white rounded-xl cursor-pointer hover:bg-red-400 transition duration-200  shadow-sm shadow-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset Filters
            </button>
          </div>

          {filtersApplied && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
              Filters Applied
            </span>
          )}

          {/* Filter Section */}
          <div className="flex flex-wrap gap-4 bg-white p-6 rounded-xl border shadow">
            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Report Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-300"
              />
            </div>

            {/* Location Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Location
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-300"
              >
                <option value="">All Locations</option>
                {LOCATIONS.map((loc, idx) => (
                  <option key={idx} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Min Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Min Amount
              </label>
              <input
                type="number"
                placeholder="₦0"
                value={filters.minAmount}
                onChange={(e) =>
                  setFilters({ ...filters, minAmount: e.target.value })
                }
                className="px-4 py-2 rounded-lg border border-gray-300"
              />
            </div>

            {/* Max Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Max Amount
              </label>
              <input
                type="number"
                placeholder="₦100,000"
                value={filters.maxAmount}
                onChange={(e) =>
                  setFilters({ ...filters, maxAmount: e.target.value })
                }
                className="px-4 py-2 rounded-lg border border-gray-300"
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value })
                }
                className="px-4 py-2 rounded-lg border border-gray-300"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value })
                }
                className="px-4 py-2 rounded-lg border border-gray-300"
              />
            </div>

            {/* Apply Filters Button */}
            <div className="self-end">
              <button
                onClick={() => {
                  // Call a filter handler or fetch function
                  if (typeof onApplyFilters === "function") {
                    onApplyFilters({
                      selectedDate,
                      selectedLocation,
                      ...filters,
                    });
                  }
                }}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg cursor-pointer font-medium shadow-sm hover:bg-white hover:border hover:border-blue-500 hover:text-blue-500 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply Filters
              </button>
            </div>
          </div>

          {/* Total Summary Section */}
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-sm text-gray-500">
                Loading Data...
              </span>
            </div>
          ) : (
            <>
              {/* Always show Total Cash Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-blue-50 border border-blue-200 p-6 rounded-xl shadow">
                {/* Total Cash Received */}
                <div className="text-center">
                  <h3 className="text-sm text-gray-600 mb-1">
                    Total Cash Received
                  </h3>
                  <p className="text-2xl font-bold text-blue-800">
                    ₦{totalCashReceived.toLocaleString()}
                  </p>
                </div>

                {/* Total Expenses */}
                <div className="text-center">
                  <h3 className="text-sm text-gray-600 mb-1">Total Expenses</h3>
                  <p className="text-2xl font-bold text-red-600">
                    ₦{totalExpenses.toLocaleString()}
                  </p>
                </div>

                {/* Total Cash at Hand */}
                <div className="text-center">
                  <h3 className="text-sm text-gray-600 mb-1">
                    Total Cash at Hand
                  </h3>
                  <p className="text-2xl font-bold text-green-700">
                    ₦{Number(totalCashAtHand).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Show Chart + Expense List only if there are filteredExpenses */}
              {filteredExpenses.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  <div className="bg-white p-6 rounded-xl shadow border border-blue-100 relative">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold text-blue-700">
                        Category Breakdown
                      </h2>
                      <button
                        onClick={() => setShowBarChart(!showBarChart)}
                        className="text-blue-600 hover:text-blue-800"
                        title={
                          showBarChart
                            ? "Switch to Pie Chart"
                            : "Switch to Bar Chart"
                        }
                      >
                        {showBarChart ? (
                          <PieIcon className="w-5 h-5" />
                        ) : (
                          <BarChart2 className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    <ResponsiveContainer width="100%" height={320}>
                      {showBarChart ? (
                        <BarChart data={chartData}>
                          <XAxis dataKey="category" />
                          <YAxis />
                          <Tooltip
                            formatter={(value) =>
                              `₦${Number(value).toLocaleString()}`
                            }
                          />
                          <Legend />
                          <Bar dataKey="amount" fill="#3B82F6">
                            {chartData.map((entry, index) => (
                              <Cell
                                key={`bar-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      ) : (
                        <PieChart>
                          <Pie
                            data={chartData}
                            dataKey="amount"
                            nameKey="category"
                            cx="50%"
                            cy="50%"
                            outerRadius={110}
                            label={({ name }) => name}
                          >
                            {chartData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value) =>
                              `₦${Number(value).toLocaleString()}`
                            }
                          />
                          <Legend />
                        </PieChart>
                      )}
                    </ResponsiveContainer>
                  </div>

                  {/* Expense List */}
                  <div className="bg-white p-6 rounded-xl shadow border border-blue-100 overflow-auto">
                    <h2 className="text-lg font-semibold text-blue-700 mb-4">
                      All Expenses
                    </h2>
                    <ul className="space-y-3 max-h-[320px] overflow-y-auto pr-2">
                      {sortedExpenses.map((exp) => (
                        <li
                          key={exp._id}
                          className="flex flex-col border-b pb-2 border-gray-200"
                        >
                          <span className="font-medium text-gray-800">
                            {exp.title}
                          </span>
                          <span className="text-sm text-gray-600">
                            ₦{Number(exp.amount).toLocaleString()} -{" "}
                            {exp.category?.name || "Uncategorized"}{" "}
                            {exp.location && `- ${exp.location}`}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(exp.createdAt).toLocaleDateString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex flex-wrap gap-3 items-center mt-4">
                      {/* Excel Export */}
                      <button
                        onClick={exportToExcel}
                        className="group relative flex items-center gap-2 px-4 py-1.5 rounded-lg border border-green-400 bg-white text-green-500 cursor-pointer text-sm font-medium shadow-sm transition duration-300 ease-in-out hover:bg-green-400 hover:text-white hover:shadow-md"
                      >
                        <FaFileExcel className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                        <span className="tracking-tight">Excel</span>
                      </button>

                      {/* PDF Export */}
                      <button
                        onClick={() => ExportToPDF(filteredExpenses, report)}
                        className="group relative flex items-center gap-2 px-4 py-1.5 rounded-lg border border-red-400 bg-white text-red-500 text-sm cursor-pointer font-medium shadow-sm transition duration-300 ease-in-out hover:bg-red-400 hover:text-white hover:shadow-md"
                      >
                        <FaFilePdf className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                        <span className="tracking-tight">PDF</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 font-medium py-10">
                  No expenses match the selected filters.
                </div>
              )}

              {/* Daily Cash Report*/}
              <div className="bg-gradient-to-br from-white to-blue-50 p-6 rounded-xl shadow border border-blue-100 mt-10">
                <h2 className="text-2xl font-bold text-blue-900 mb-6 flex items-center gap-2">
                  💰 Daily Cash Report
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Ibile 1 */}
                  <div className="bg-white border border-blue-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300">
                    <h3 className="text-lg font-semibold text-blue-700 mb-4 flex items-center gap-2">
                      🏪 Ibile 1
                    </h3>
                    {filteredDailyCash.filter((r) => r.location === "Ibile 1")
                      .length === 0 ? (
                      <p className="text-gray-500 text-sm italic">
                        No daily cash records for Ibile 1.
                      </p>
                    ) : (
                      <ul className="max-h-64 overflow-y-auto divide-y divide-gray-200 pr-1">
                        {filteredDailyCash
                          .filter((r) => r.location === "Ibile 1")
                          .map(({ _id, date, amount }) => {
                            const formattedDate = new Date(date)
                              .toISOString()
                              .split("T")[0];
                            const highlightDate = selectedDate || todayStr;
                            const isHighlighted =
                              formattedDate === highlightDate;

                            return (
                              <li
                                key={_id}
                                className={`flex justify-between py-2 items-center ${
                                  isHighlighted
                                    ? "bg-blue-50 rounded-lg px-2"
                                    : ""
                                }`}
                              >
                                <span className="flex items-center gap-1 text-gray-700 text-sm">
                                  📅 {formattedDate}
                                </span>
                                <span className="font-semibold text-blue-700 text-base">
                                  ₦{Number(amount).toLocaleString()}
                                </span>
                              </li>
                            );
                          })}
                      </ul>
                    )}
                  </div>

                  {/* Ibile 2 */}
                  <div className="bg-white border border-blue-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300">
                    <h3 className="text-lg font-semibold text-blue-700 mb-4 flex items-center gap-2">
                      🏪 Ibile 2
                    </h3>
                    {filteredDailyCash.filter((r) => r.location === "Ibile 2")
                      .length === 0 ? (
                      <p className="text-gray-500 text-sm italic">
                        No daily cash records for Ibile 2.
                      </p>
                    ) : (
                      <ul className="max-h-64 overflow-y-auto divide-y divide-gray-200 pr-1">
                        {filteredDailyCash
                          .filter((r) => r.location === "Ibile 2")
                          .map(({ _id, date, amount }) => {
                            const formattedDate = new Date(date)
                              .toISOString()
                              .split("T")[0];
                            const highlightDate = selectedDate || todayStr;
                            const isHighlighted =
                              formattedDate === highlightDate;

                            return (
                              <li
                                key={_id}
                                className={`flex justify-between py-2 items-center ${
                                  isHighlighted
                                    ? "bg-blue-50 rounded-lg px-2"
                                    : ""
                                }`}
                              >
                                <span className="flex items-center gap-1 text-gray-700 text-sm">
                                  📅 {formattedDate}
                                </span>
                                <span className="font-semibold text-blue-700 text-base">
                                  ₦{Number(amount).toLocaleString()}
                                </span>
                              </li>
                            );
                          })}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              {/* End of Day Report */}
              {report ? (
                <div className="bg-white shadow-xl p-6 rounded-2xl border border-blue-100 space-y-6">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-blue-800">
                      📊 End of Day Report
                    </h2>
                    <p className="text-gray-600 text-sm">
                      <span className="font-medium">Date:</span>{" "}
                      {new Date(report.date).toLocaleDateString("en-GB")}{" "}
                      &nbsp;|&nbsp;
                      <span className="font-medium">Location:</span>{" "}
                      {report.location}
                    </p>
                  </div>

                  {/* Table Summary Section */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
                      <thead className="bg-blue-50 text-blue-800 text-sm uppercase">
                        <tr>
                          <th className="px-4 py-3 text-left">Metric</th>
                          <th className="px-4 py-3 text-right">Amount (₦)</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-800 text-sm divide-y divide-gray-200">
                        <tr>
                          <td className="px-4 py-2 font-medium">
                            Cash B/F (Prev. Day)
                          </td>
                          <td className="px-4 py-2 text-right">
                            {report.cashBroughtForward.toLocaleString() || "0"}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-medium">
                            Cash Received (
                            {new Date(report.date).toLocaleDateString("en-GB")})
                          </td>
                          <td className="px-4 py-2 text-right">
                            {report.cashToday.toLocaleString() || "0"}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-medium">
                            Total Cash Available
                          </td>
                          <td className="px-4 py-2 text-right font-semibold text-blue-700">
                            {report.totalCashAvailable.toLocaleString()}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-medium">
                            Total Payments
                          </td>
                          <td className="px-4 py-2 text-right text-red-600">
                            -{report.totalPayments.toLocaleString()}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-bold text-green-700">
                            Cash at Hand
                          </td>
                          <td
                            className={`px-4 py-2 text-right font-bold ${
                              report.cashAtHand < 0
                                ? "text-red-600"
                                : "text-green-700"
                            }`}
                          >
                            {report.cashAtHand.toLocaleString()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Payments Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      💸 Payments
                    </h3>
                    {report.payments.length > 0 ? (
                      (() => {
                        const filteredPayments = report.payments
                          .filter((p) => {
                            const amount = Number(p.amount);
                            const date = p.date || report.date;
                            const location = p.location || report.location;

                            return (
                              isMatchByDateAndOrLocation(date, location) &&
                              (!filtersApplied ||
                                ((!filters.minAmount ||
                                  amount >= Number(filters.minAmount)) &&
                                  (!filters.maxAmount ||
                                    amount <= Number(filters.maxAmount)) &&
                                  (!filters.startDate ||
                                    new Date(date) >=
                                      new Date(filters.startDate)) &&
                                  (!filters.endDate ||
                                    new Date(date) <=
                                      new Date(filters.endDate))))
                            );
                          })
                          .sort((a, b) => {
                            const dateA = new Date(a.date || report.date);
                            const dateB = new Date(b.date || report.date);
                            return dateB - dateA; // Most recent payments first
                          });

                        const filteredTotalPayments = filteredPayments.reduce(
                          (sum, p) => sum + Number(p.amount || 0),
                          0
                        );
                        return (
                          <ul className="divide-y divide-gray-100 text-sm text-gray-700 border border-gray-200 rounded-lg overflow-hidden">
                            {filteredPayments.map((p, idx) => (
                              <li
                                key={idx}
                                className="flex justify-between px-4 py-2 bg-gray-50 hover:bg-gray-100"
                              >
                                <span>
                                  {p.title}
                                  <span className="ml-2 text-gray-400 text-xs">
                                    {new Date(
                                      p.date || report.date
                                    ).toLocaleDateString()}
                                  </span>
                                </span>

                                <span className="font-normal">
                                  ₦{Number(p.amount).toLocaleString()}
                                </span>
                              </li>
                            ))}
                            <li className="flex justify-between font-semibold px-4 py-2 bg-gray-200 hover:bg-gray-300 border-t-1 border-gray-500">
                              <span>Total</span>
                              <span>
                                ₦{filteredTotalPayments.toLocaleString()}
                              </span>
                            </li>
                          </ul>
                        );
                      })()
                    ) : (
                      <p className="text-sm text-gray-500 italic">
                        No payment records for this date.
                      </p>
                    )}
                  </div>
                  <div className="flex justify-between gap-12 items-center border-t pt-4 mt-4  border-gray-200">
                    {/* Staff Section */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        👥 Staff on Duty
                      </h3>

                      {report.staff?.name ? (
                        <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium shadow-sm">
                          <svg
                            className="w-4 h-4 mr-2 text-blue-700"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 2a4 4 0 100 8 4 4 0 000-8zM2 16a8 8 0 1116 0H2z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {report.staff.name}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">
                          No staff recorded for this date.
                        </p>
                      )}
                    </div>
                    {/* Share Buttons */}
                    <div className="mt-4 flex flex-wrap gap-3">
                      {/* Copy & Share */}
                      <button
                        onClick={() => copyReportToClipboard(report)}
                        className="group relative flex items-center gap-2 px-4 py-1.5 rounded-lg border border-blue-400 bg-white text-blue-600 text-sm font-medium shadow-sm transition duration-300 ease-in-out hover:bg-blue-500 hover:text-white hover:shadow-md"
                      >
                        <FaCopy className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                        <span className="tracking-tight">Copy</span>
                      </button>

                      {/* WhatsApp Share */}
                      <button
                        onClick={() => shareViaWhatsApp(report)}
                        className="group relative flex items-center gap-2 px-4 py-1.5 rounded-lg border cursor-pointer border-green-400 bg-white text-green-600 text-sm font-medium shadow-sm transition duration-300 ease-in-out hover:bg-green-500 hover:text-white hover:shadow-md"
                      >
                        <FaWhatsapp className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                        <span className="tracking-tight">WhatsApp</span>
                      </button>

                      {/* Email Share */}
                      <a
                        href={`mailto:?subject=End of Day Report - ${new Date(
                          report?.date
                        ).toLocaleDateString(
                          "en-GB"
                        )}&body=${encodeURIComponent(
                          `📊 End of Day Report\nDate: ${new Date(
                            report?.date
                          ).toLocaleDateString("en-GB")}\nLocation: ${
                            report?.location
                          }`
                        )}`}
                        className="group relative flex items-center gap-2 px-4 py-1.5 rounded-lg border border-gray-400 bg-white text-gray-700 cursor-pointer text-sm font-medium shadow-sm transition duration-300 ease-in-out hover:bg-gray-600 hover:text-white hover:shadow-md"
                      >
                        <FaEnvelope className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                        <span className="tracking-tight">Email</span>
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white shadow-md p-6 rounded-xl text-center text-gray-500 border border-gray-200">
                  {reportError ||
                    "Select a report date and location to view the report."}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
