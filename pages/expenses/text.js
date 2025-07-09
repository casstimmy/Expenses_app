import Layout from "@/components/Layout";
import {
  FaFilePdf,
  FaFileExcel,
  FaCopy,
  FaWhatsapp,
  FaEnvelope,
} from "react-icons/fa";
import { useEffect, useState } from "react";
import ExportToPDF from "@/components/ExportToPDF";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
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
  "#3B82F6", "#60A5FA", "#93C5FD", "#1E3A8A",
  "#2563EB", "#1D4ED8", "#60A5FA",
];

const LOCATIONS = ["Ibile 1", "Ibile 2"];

export default function ExpenseAnalysis() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dailyCashRecords, setDailyCashRecords] = useState([]);
  const [report, setReport] = useState(null);
  const [reportError, setReportError] = useState("");
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedLocation, setSelectedLocation] = useState("");
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
    const localExpenses = localStorage.getItem("expenses");
    const localCash = localStorage.getItem("dailyCashRecords");

    if (localExpenses && localCash) {
      try {
        setExpenses(JSON.parse(localExpenses));
        setDailyCashRecords(JSON.parse(localCash));
        setLoading(false);
      } catch (err) {
        console.error("Failed to parse localStorage data", err);
      }
    } else {
      const fetchAll = async () => {
        setLoading(true);
        try {
          const expenseRes = await fetch("/api/expenses");
          const expenseData = await expenseRes.json();
          if (expenseRes.ok) {
            setExpenses(expenseData);
            localStorage.setItem("expenses", JSON.stringify(expenseData));
          }

          const cashRes = await fetch("/api/daily-cash");
          const cashData = await cashRes.json();
          if (cashRes.ok) {
            setDailyCashRecords(cashData);
            localStorage.setItem("dailyCashRecords", JSON.stringify(cashData));
          }
        } catch (err) {
          console.error("Error fetching data:", err);
        } finally {
          setLoading(false);
        }
      };

      fetchAll();
    }

    const fetchReportForSelectedLocation = async () => {
      if (!selectedLocation) return;
      try {
        const res = await fetch(
          `/api/daily-cash/report?date=${selectedDate}&location=${encodeURIComponent(selectedLocation)}`
        );
        const data = await res.json();
        if (res.ok && !data?.error) {
          setReport(data);
          setReportsByStore((prev) => ({
            ...prev,
            [selectedLocation]: data,
          }));
          setReportError("");
        } else {
          setReport(null);
          setReportError(data?.error || "Error fetching report");
        }
      } catch {
        setReport(null);
        setReportError("Network error");
      }
    };

    fetchReportForSelectedLocation();
  }, [selectedDate, selectedLocation]);

  const isMatchByDateAndOrLocation = (recordDate, recordLocation) => {
    const dateOnly = new Date(recordDate).toISOString().split("T")[0];
    const matchesDate = !selectedDate || dateOnly === selectedDate;
    const matchesLocation = !selectedLocation ||
      (recordLocation &&
        recordLocation.toLowerCase().includes(selectedLocation.toLowerCase()));
    return matchesDate && matchesLocation;
  };

  const applyFilters = (expense) => {
    const { category, minAmount, maxAmount, startDate, endDate, location } = filters;
    const amount = Number(expense.amount);
    const date = new Date(expense.createdAt);
    return (
      (!category || expense.category?.name === category) &&
      (!location || (expense.location && expense.location.toLowerCase().includes(location.toLowerCase()))) &&
      (!minAmount || amount >= Number(minAmount)) &&
      (!maxAmount || amount <= Number(maxAmount)) &&
      (!startDate || date >= new Date(startDate)) &&
      (!endDate || date <= new Date(endDate))
    );
  };

  const filteredDailyCash = dailyCashRecords.filter(
    (record) => !selectedLocation ||
      (record.location && record.location.toLowerCase().includes(selectedLocation.toLowerCase()))
  );

  const filteredExpenses = expenses
    .filter((exp) => isMatchByDateAndOrLocation(exp.createdAt, exp.location))
    .filter(applyFilters);

  const totalCashAtHand = selectedLocation
    ? reportsByStore[selectedLocation]?.cashAtHand || 0
    : (reportsByStore["Ibile 1"]?.cashAtHand || 0) +
      (reportsByStore["Ibile 2"]?.cashAtHand || 0);

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredExpenses);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "Expense_Report.xlsx");
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-blue-800 mb-2">
                Expense Dashboard
              </h1>
              <p className="text-gray-600">Visualize and monitor your business expenditures in one place.</p>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem("expenses");
                localStorage.removeItem("dailyCashRecords");
                window.location.reload();
              }}
              className="text-xs bg-blue-500 p-2 text-white rounded-xl hover:bg-white hover:text-blue-500 hover:border border-blue-200"
            >
              🔄 Refresh Data
            </button>
          </div>

          {/* Summary Box */}
          {!loading && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-blue-50 border border-blue-200 p-6 rounded-xl shadow">
              <div className="text-center">
                <h3 className="text-sm text-gray-600 mb-1">Total Cash Received</h3>
                <p className="text-2xl font-bold text-blue-800">
                  ₦{filteredDailyCash.reduce((acc, r) => acc + Number(r.amount || 0), 0).toLocaleString()}
                </p>
              </div>

              <div className="text-center">
                <h3 className="text-sm text-gray-600 mb-1">Total Expenses</h3>
                <p className="text-2xl font-bold text-red-600">
                  ₦{filteredExpenses.reduce((acc, r) => acc + Number(r.amount || 0), 0).toLocaleString()}
                </p>
              </div>

              <div className="text-center">
                <h3 className="text-sm text-gray-600 mb-1">Total Cash at Hand</h3>
                <p className="text-2xl font-bold text-green-700">
                  ₦{Number(totalCashAtHand).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
