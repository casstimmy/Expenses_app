// ─── External Libraries ────────────────────────────────────────────────
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Link from "next/link";
// ─── Components ────────────────────────────────────────────────────────
import Layout from "@/components/Layout";
import ExportToPDF from "@/components/ExportToPDF";
import CategoryChart from "@/components/CategoryChart";
import EndOfDayReport from "@/components/EndOfDayReport";
import ExpenseList from "@/components/ExpenseList";
import PeriodFilter from "@/components/PeriodFilter";

// ─── Icons ─────────────────────────────────────────────────────────────
import { FaSyncAlt } from "react-icons/fa";

// ─── Helpers ───────────────────────────────────────────────────────────
import {
  shareViaWhatsApp,
  copyReportToClipboard,
} from "@/components/reportHelpers";

// ─── Constants ─────────────────────────────────────────────────────────
const LOCATIONS = ["Ibile 1", "Ibile 2"];
const todayStr = new Date().toISOString().split("T")[0];

// ─── Component ─────────────────────────────────────────────────────────
export default function ExpenseAnalysis() {
  const [expenses, setExpenses] = useState([]);
  const [dailyCashRecords, setDailyCashRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showBarChart, setShowBarChart] = useState(false);
  const [report, setReport] = useState(null);
  const [reportError, setReportError] = useState("");

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [filtersApplied, setFiltersApplied] = useState(false);
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
    selectedLocation: "",
  });

  // ─── Effects ────────────────────────────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      try {
        // Try localStorage first
        let localExpenses = JSON.parse(
          localStorage.getItem("expenses") || "[]"
        );
        let localCash = JSON.parse(
          localStorage.getItem("dailyCashRecords") || "[]"
        );

        setExpenses(localExpenses);
        setDailyCashRecords(localCash);

        // Fetch if empty
        if (!localExpenses.length || !localCash.length) {
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
        }
      } catch (err) {
        console.error("Error loading data:", err);
        setReportError("Network or data error");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Separate effect for fetching report by location
  useEffect(() => {
    const fetchReport = async () => {
      if (!selectedLocation) {
        setReport(null);
        return;
      }

      try {
        const res = await fetch(
          `/api/daily-cash/report?date=${selectedDate}&location=${encodeURIComponent(
            selectedLocation
          )}`
        );
        const data = await res.json();

        if (res.ok && !data?.error) {
          setReportsByStore((prev) => ({ ...prev, [selectedLocation]: data }));
          setReport(data);
          setReportError("");
        } else {
          setReport(null);
          setReportError(data?.error || "Error fetching report");
        }
      } catch (err) {
        console.error("Report fetch error:", err);
        setReportError("Network error while fetching report");
      }
    };

    fetchReport();
  }, [selectedDate, selectedLocation]);

  // ─── Helper Functions ───────────────────────────────────────────────
  const resetFilters = () => {
    setSelectedDate(todayStr);
    setSelectedLocation("");
    setFilters({
      category: "",
      minAmount: "",
      maxAmount: "",
      startDate: "",
      endDate: "",
      selectedLocation: "",
    });
    setFiltersApplied(false);
    setReport(null);
  };

  const isWithinDateRange = (dateStr) => {
    const date = new Date(dateStr);
    const { startDate, endDate } = filters;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      return date >= start && date <= end;
    }
    return date.toISOString().split("T")[0] === selectedDate;
  };

  const exportToExcel = (data) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blobData = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blobData, `Expenses_Report_${new Date().toISOString()}.xlsx`);
  };

  // ─── Derived Data ───────────────────────────────────────────────────
  // Ensure filters.selectedLocation is always in sync with selectedLocation
  useEffect(() => {
    setFilters((prev) => ({ ...prev, selectedLocation }));
  }, [selectedLocation]);

  const filteredExpenses = expenses.filter((exp) => {
    const expDate = new Date(exp.createdAt);
    const matchesStart =
      !filters.startDate || new Date(filters.startDate) <= expDate;
    const matchesEnd = !filters.endDate || new Date(filters.endDate) >= expDate;
    const matchesLocation =
      !filters.selectedLocation || exp.location === filters.selectedLocation;
    const matchesCategory =
      !filters.category || exp.category?.name === filters.category;
    const matchesMin =
      !filters.minAmount || exp.amount >= Number(filters.minAmount);
    const matchesMax =
      !filters.maxAmount || exp.amount <= Number(filters.maxAmount);

    return (
      matchesStart &&
      matchesEnd &&
      matchesLocation &&
      matchesCategory &&
      matchesMin &&
      matchesMax
    );
  });

  const sortedExpenses = [...filteredExpenses].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const filteredDailyCash = dailyCashRecords.filter(
    (record) =>
      !selectedLocation ||
      (record.location &&
        record.location.toLowerCase().includes(selectedLocation.toLowerCase()))
  );

  const totalCashReceived = dailyCashRecords
    .filter(
      (r) =>
        isWithinDateRange(r.date) &&
        (!selectedLocation ||
          (r.location &&
            r.location.toLowerCase().includes(selectedLocation.toLowerCase())))
    )
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);

  const totalExpenses = expenses
    .filter(
      (r) =>
        isWithinDateRange(r.createdAt) &&
        (!selectedLocation ||
          (r.location &&
            r.location.toLowerCase().includes(selectedLocation.toLowerCase())))
    )
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);

  const expensesByCategory = filteredExpenses.reduce((acc, curr) => {
    const catName = curr.category?.name || "Uncategorized";
    acc[catName] = (acc[catName] || 0) + Number(curr.amount);
    return acc;
  }, {});

  const chartData = Object.entries(expensesByCategory).map(
    ([category, amount]) => ({
      category,
      amount,
    })
  );

  const totalCashAtHand = selectedLocation
    ? reportsByStore[selectedLocation]?.cashAtHand || 0
    : LOCATIONS.reduce(
        (sum, loc) => sum + (reportsByStore[loc]?.cashAtHand || 0),
        0
      );

  // ─── Render ─────────────────────────────────────────────────────────
  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header + Refresh */}
          <div className="flex flex-row justify-between items-start">
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
                setIsRefreshing(true);
                localStorage.removeItem("expenses");
                localStorage.removeItem("dailyCashRecords");
                window.location.reload();
              }}
              className="flex items-center gap-1 bg-blue-500 px-4 py-2 text-white rounded-xl h-10 hover:bg-white hover:text-blue-500 hover:border-2 hover:border-blue-200 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <FaSyncAlt />
              )}
              <span className="hidden sm:inline">
                {isRefreshing ? "Refreshing..." : "Refresh Data"}
              </span>
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center justify-between mt-4 mb-2">
            <div className="text-sm text-gray-600">
              {(selectedDate || selectedLocation || filtersApplied) && (
                <>
                  <span>Active Filters:</span>
                  {filters.startDate && filters.endDate ? (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      Period: {filters.startDate} to {filters.endDate}
                    </span>
                  ) : (
                    selectedDate && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        Date: {selectedDate}
                      </span>
                    )
                  )}
                  {selectedLocation && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                      Location: {selectedLocation}
                    </span>
                  )}
                  {filters.minAmount && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                      Min: ₦{Number(filters.minAmount).toLocaleString()}
                    </span>
                  )}
                  {filters.maxAmount && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                      Max: ₦{Number(filters.maxAmount).toLocaleString()}
                    </span>
                  )}
                  {filters.category && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                      Category: {filters.category}
                    </span>
                  )}
                </>
              )}
            </div>
            <button
              onClick={resetFilters}
              className="text-xs bg-red-500 p-2 text-white rounded-xl hover:bg-red-400 transition duration-200 shadow-sm shadow-red-200"
            >
              Reset Filters
            </button>
          </div>

          {/* Filter Inputs */}
          <div className="flex flex-wrap gap-4 bg-white p-6 rounded-xl border shadow">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Period
              </label>
              <PeriodFilter
                selectedPeriod={selectedPeriod}
                setSelectedPeriod={setSelectedPeriod}
                setSelectedDate={setSelectedDate}
                setFilters={setFilters}
                setFiltersApplied={setFiltersApplied}
              />
            </div>
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
          </div>

          {/* Summary */}
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-sm text-gray-500">
                Loading Data...
              </span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-blue-50 border border-blue-200 p-6 rounded-xl shadow">
                <div className="text-center">
                  <h3 className="text-sm text-gray-600 mb-1">
                    Total Cash Received
                  </h3>
                  <p className="text-2xl font-bold text-blue-800">
                    ₦{totalCashReceived.toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <h3 className="text-sm text-gray-600 mb-1">Total Expenses</h3>
                  <p className="text-2xl font-bold text-red-600">
                    ₦{totalExpenses.toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <h3 className="text-sm text-gray-600 mb-1">
                    Total Cash at Hand
                  </h3>
                  <p className="text-2xl font-bold text-green-700">
                    ₦{Number(totalCashAtHand).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Chart + Expense List */}
              {sortedExpenses.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  <CategoryChart
                    chartData={chartData}
                    showBarChart={showBarChart}
                    setShowBarChart={setShowBarChart}
                  />
                  <ExpenseList
                    sortedExpenses={sortedExpenses}
                    exportToExcel={exportToExcel}
                    exportToPDF={ExportToPDF}
                    report={report}
                    filters={filters}
                  />
                </div>
              ) : (
                <div className="text-center text-gray-500 font-medium py-10">
                  No expenses match the selected filters.
                </div>
              )}

              {/* Daily Cash Report */}
              <div className="bg-gradient-to-br from-white to-blue-50 p-6 rounded-xl shadow border border-blue-100 mt-10">
                <h2 className="text-2xl font-bold text-blue-900 mb-6 flex items-center gap-2">
                  💰 Daily Cash Report
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {LOCATIONS.map((loc) => (
                    <div
                      key={loc}
                      className="bg-white border border-blue-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <h3 className="text-lg font-semibold text-blue-700 mb-4 flex items-center gap-2">
                        🏪 {loc}
                      </h3>
                      {filteredDailyCash.filter((r) => r.location === loc)
                        .length === 0 ? (
                        <p className="text-gray-500 text-sm italic">
                          No daily cash records for {loc}.
                        </p>
                      ) : (
                        <ul className="max-h-64 overflow-y-auto divide-y divide-gray-200 pr-1">
                          {filteredDailyCash
                            .filter((r) => r.location === loc)
                            .map(({ _id, date, amount }) => {
                              const formattedDate = new Date(date)
                                .toISOString()
                                .split("T")[0];
                              const isHighlighted =
                                formattedDate === (selectedDate || todayStr);
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
                  ))}
                </div>
              </div>

              {/* End of Day Report */}
              <EndOfDayReport
                report={report}
                filters={filters}
                filtersApplied={filtersApplied}
                isMatchByDateAndOrLocation={() => true}
                copyReportToClipboard={copyReportToClipboard}
                shareViaWhatsApp={shareViaWhatsApp}
                reportError={reportError}
              />
            </>
          )}
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <Link href="/details/Ibile1">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow-md transition">
            📊 View Ibile 1 Details
          </button>
        </Link>
      </div>
    </Layout>
  );
}
