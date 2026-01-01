"use client";

import Layout from "@/components/Layout";
import ExpenseForm from "@/components/ExpenseForm";
import DeleteConfirm from "@/components/modals/DeleteConfirm";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/router";
import {
  CalendarDays,
  CircleDollarSign,
  MapPin,
  CheckCircle,
} from "lucide-react";

/* ============================
   In-file PeriodFilter Component
   (keeps everything in a single file)
   ============================ */
function getDateRangeFromPeriod(period) {
  const today = new Date();
  const iso = (date) => date.toISOString().split("T")[0];

  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  const endOfLastWeek = new Date(startOfWeek);
  endOfLastWeek.setDate(startOfWeek.getDate() - 1);

  const startOfLastWeek = new Date(endOfLastWeek);
  startOfLastWeek.setDate(endOfLastWeek.getDate() - 6);

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
  const startOfLastMonth = new Date(
    endOfLastMonth.getFullYear(),
    endOfLastMonth.getMonth(),
    1
  );

  switch (period) {
    case "today":
      return { selectedDate: iso(today), startDate: "", endDate: "" };
    case "yesterday": {
      const y = new Date(today);
      y.setDate(today.getDate() - 1);
      return { selectedDate: iso(y), startDate: "", endDate: "" };
    }
    case "thisWeek": {
      const endOfToday = new Date(today);
      endOfToday.setHours(23, 59, 59, 999);
      return {
        selectedDate: "",
        startDate: iso(startOfWeek),
        endDate: endOfToday.toISOString(),
      };
    }
    case "lastWeek":
      return {
        selectedDate: "",
        startDate: iso(startOfLastWeek),
        endDate: iso(endOfLastWeek),
      };
    case "thisMonth": {
      const endOfToday = new Date(today);
      endOfToday.setHours(23, 59, 59, 999);
      return {
        selectedDate: "",
        startDate: iso(startOfMonth),
        endDate: endOfToday.toISOString(),
      };
    }
    case "lastMonth":
      return {
        selectedDate: "",
        startDate: iso(startOfLastMonth),
        endDate: iso(endOfLastMonth),
      };
    case "custom":
    case "specific":
      return { selectedDate: "", startDate: "", endDate: "" };
    default:
      return { selectedDate: "", startDate: "", endDate: "" };
  }
}

function PeriodFilter({
  selectedPeriod,
  setSelectedPeriod,
  setSelectedDate,
  setFilters,
  setFiltersApplied,
}) {
  useEffect(() => {
    if (!selectedPeriod || selectedPeriod === "custom" || selectedPeriod === "specific") return;
    const { selectedDate, startDate, endDate } = getDateRangeFromPeriod(selectedPeriod);
    setSelectedDate(selectedDate);
    setFilters((prev) => ({ ...prev, startDate, endDate }));
    setFiltersApplied(true);
  }, [selectedPeriod, setFilters, setFiltersApplied, setSelectedDate]);

  return (
    <div>
      <select
        value={selectedPeriod}
        onChange={(e) => setSelectedPeriod(e.target.value)}
        className="px-4 py-2 rounded-lg border border-gray-300 text-sm"
      >
        <option value="">Filter by period</option>
        <option value="today">Today</option>
        <option value="yesterday">Yesterday</option>
        <option value="thisWeek">This Week</option>
        <option value="lastWeek">Last Week</option>
        <option value="thisMonth">This Month</option>
        <option value="lastMonth">Last Month</option>
        <option value="specific">Specific Date</option>
        <option value="custom">Specific Period</option>
      </select>

      {selectedPeriod === "specific" && (
        <div className="mt-2">
          <label className="block text-sm text-gray-600">Select Date</label>
          <input
            type="date"
            onChange={(e) => {
              const value = e.target.value;
              setSelectedDate(value);
              setFilters((prev) => ({ ...prev, startDate: "", endDate: "", selectedDate: value }));
              setFiltersApplied(true);
            }}
            className="px-4 py-2 border rounded-lg text-sm"
          />
        </div>
      )}

      {selectedPeriod === "custom" && (
        <div className="flex gap-4 mt-2">
          <div>
            <label className="block text-sm text-gray-600">Start Date</label>
            <input
              type="date"
              onChange={(e) => {
                const value = e.target.value;
                setFilters((prev) => {
                  const newFilters = { ...prev, startDate: value };
                  if (newFilters.startDate && newFilters.endDate) setFiltersApplied(true);
                  return newFilters;
                });
              }}
              className="px-4 py-2 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">End Date</label>
            <input
              type="date"
              onChange={(e) => {
                const value = e.target.value;
                setFilters((prev) => {
                  const newFilters = { ...prev, endDate: value };
                  if (newFilters.startDate && newFilters.endDate) setFiltersApplied(true);
                  return newFilters;
                });
              }}
              className="px-4 py-2 border rounded-lg text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================
   Main ManageExpenses Component
   ============================ */
export default function ManageExpenses() {
  const [staffData, setStaffData] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [cashEntries, setCashEntries] = useState([]);
  const [categories, setCategories] = useState([]);

  const [cashAmount, setCashAmount] = useState("");
  const [cashDate, setCashDate] = useState(new Date().toISOString().split("T")[0]);
  const [savingCash, setSavingCash] = useState(false);
  const [cashSavedMessage, setCashSavedMessage] = useState("");

  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editedAmount, setEditedAmount] = useState("");
  const [editedDate, setEditedDate] = useState("");
  const [editedTitle, setEditedTitle] = useState("");
  const [editedCategory, setEditedCategory] = useState("");

  const [editingCashId, setEditingCashId] = useState(null);
  const [editedCashAmount, setEditedCashAmount] = useState("");
  const [editedCashDate, setEditedCashDate] = useState("");

  const [selectedLocation, setSelectedLocation] = useState("All");
  const [filterDate, setFilterDate] = useState("");
  const [loading, setLoading] = useState(true);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [toDeleteExpense, setToDeleteExpense] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [filters, setFilters] = useState({ startDate: "", endDate: "", selectedDate: "" });
  const [filtersApplied, setFiltersApplied] = useState(false);

  const router = useRouter();
  const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  // -------------------------
  // Utils
  // -------------------------
  const formatCurrency = (v) => `₦${Math.round(Number(v) || 0).toLocaleString("en-NG")}`;

  const formatDateDDMMYYYY = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d)) return "—";
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  };

  // Safer combine: preserve time portion from originalIso (if valid).
  // Build Date using numeric parts to avoid Date('YYYY-MM-DD') inconsistencies.
  const combineDateKeepTime = (dateOnlyString, originalIsoString) => {
    if (!dateOnlyString) return originalIsoString || new Date().toISOString();
    const parts = dateOnlyString.split("-").map(Number);
    const [y, m, d] = parts;
    if (!(y && m && d)) return originalIsoString || new Date().toISOString();

    if (originalIsoString) {
      const orig = new Date(originalIsoString);
      if (!Number.isNaN(orig.getTime())) {
        const combined = new Date(
          y,
          m - 1,
          d,
          orig.getHours(),
          orig.getMinutes(),
          orig.getSeconds(),
          orig.getMilliseconds()
        );
        return combined.toISOString();
      }
    }
    // construct local midnight for given date and return ISO
    return new Date(y, m - 1, d, 0, 0, 0, 0).toISOString();
  };

  const matchDate = (itemDate, targetDate) => {
    if (!targetDate) return true;
    if (!itemDate) return false;
    try {
      return new Date(itemDate).toISOString().split("T")[0] === targetDate;
    } catch {
      return false;
    }
  };

 const readCache = (key) => {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // if stored without ts (legacy), return stored data
    if (!parsed?.ts) return parsed?.data || null;
    // return null when expired
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed.data || null;
  } catch {
    return null;
  }
};

  const writeCache = (key, data) => {
    try {
      sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
    } catch {}
  };

  // -------------------------
  // Fetch functions
  // -------------------------
  const fetchExpenses = async () => {
    try {
      const cached = readCache("expenses_cache");
      if (cached)
        setExpenses([...cached].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)));

      const res = await fetch("/api/expenses", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const sorted = Array.isArray(data) ? data.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)) : [];
        setExpenses(sorted);
        writeCache("expenses_cache", sorted);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCashEntries = async () => {
    try {
      const cached = readCache("cash_cache");
      if (cached) setCashEntries([...cached].sort((a, b) => new Date(b.date) - new Date(a.date)));

      const res = await fetch("/api/daily-cash", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const sorted = Array.isArray(data) ? data.sort((a, b) => new Date(b.date) - new Date(a.date)) : [];
        setCashEntries(sorted);
        writeCache("cash_cache", sorted);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCategories = async () => {
    try {
      const cached = readCache("categories_cache");
      if (cached) setCategories(cached);

      const res = await fetch("/api/expense-category/expense-category", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : []);
        writeCache("categories_cache", data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // -------------------------
  // Initialization
  // -------------------------
  useEffect(() => {
    const stored = localStorage.getItem("staff");
    if (!stored) {
      router.replace("/login");
      return;
    }
    setStaffData(JSON.parse(stored));
    setLoading(true);
    Promise.all([fetchExpenses(), fetchCashEntries(), fetchCategories()]).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // -------------------------
  // Cash handlers
  // -------------------------
  const handleSaveCash = useCallback(async () => {
    if (!cashAmount || isNaN(cashAmount)) return;

    const existingEntry = cashEntries.find(
      (entry) => new Date(entry.date).toISOString().split("T")[0] === cashDate && entry.location === staffData.location
    );

    setSavingCash(true);
    try {
      if (existingEntry) {
        const res = await fetch(`/api/daily-cash/${existingEntry._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: Number(cashAmount), date: cashDate }),
        });
        if (res.ok) setCashSavedMessage("Cash updated successfully!");
        else {
          setCashSavedMessage("");
          alert("Failed to update existing entry");
        }
      } else {
        const res = await fetch("/api/daily-cash", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: Number(cashAmount), date: cashDate, location: staffData.location, staff: staffData }),
        });
        if (res.ok) setCashSavedMessage("Cash saved successfully!");
        else {
          setCashSavedMessage("");
          console.error("Failed to save daily cash");
        }
      }
    } catch (err) {
      console.error("Save cash error:", err);
    } finally {
      setCashAmount("");
      await fetchCashEntries(); // refresh list
      setTimeout(() => setCashSavedMessage(""), 3000);
      setSavingCash(false);
    }
  }, [cashAmount, cashDate, cashEntries, staffData]);

  const handleEditCashInline = useCallback((entry) => {
    setEditingCashId(entry._id);
    setEditedCashAmount(entry.amount);
    setEditedCashDate(new Date(entry.date).toISOString().split("T")[0]);
  }, []);

  const handleSaveCashInline = useCallback(async (entry) => {
    try {
      const res = await fetch(`/api/daily-cash/${entry._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(editedCashAmount), date: editedCashDate }),
      });
      if (res.ok) {
        const updated = await res.json();
        // update local list and refetch authoritative data
        setCashEntries((prev) => prev.map((c) => (c._id === updated._id ? updated : c)));
        await fetchCashEntries();
        handleCancelCashEdit();
      } else {
        console.error("Failed to update cash inline");
      }
    } catch (err) {
      console.error(err);
    }
  }, [editedCashAmount, editedCashDate]);

  const handleCancelCashEdit = useCallback(() => {
    setEditingCashId(null);
    setEditedCashAmount("");
    setEditedCashDate("");
  }, []);

  // -------------------------
  // Expense handlers
  // -------------------------
  const handleEditExpense = useCallback((expense) => {
    setEditingExpenseId(expense._id);
    setEditedAmount(expense.amount);
    setEditedTitle(expense.title || "");
    setEditedCategory(expense?.category?._id || expense?.category || "");
    setEditedDate(new Date(expense.date || expense.createdAt || new Date()).toISOString().split("T")[0]);
  }, []);

  const handleSaveExpense = async (expense) => {
    // Build payload; createdAt/date must be ISO string
    const createdAtIso = combineDateKeepTime(editedDate, expense.date || expense.createdAt);

    const payload = {
      title: editedTitle ?? expense.title,
      amount: Number(editedAmount),
      category: editedCategory || expense?.category?._id || expense?.category,
      description: expense.description || "",
      location: expense.location || null,
      staffName: staffData?.name || "",
      createdAt: createdAtIso,
      date: createdAtIso, // send both to be safe
    };

    // optional debug log
    console.log("PUT /api/expenses payload ->", { id: expense._id, payload });

    try {
      const res = await fetch(`/api/expenses/${expense._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let parsed;
      try { parsed = JSON.parse(text); } catch { parsed = text; }
      console.log("PUT /api/expenses response ->", { status: res.status, body: parsed });

      if (res.ok) {
        const updatedExpense = typeof parsed === "object" ? parsed : JSON.parse(text);

        // Update local list using server's returned document (keeps dates exactly as DB stored)
        setExpenses((prev) =>
          prev.map((e) => {
            if (e._id !== updatedExpense._id) return e;
            // Map category object if we have categories cached
            const catObj = categories.find((c) => String(c._id) === String(payload.category));
            return { ...updatedExpense, category: catObj ? { _id: catObj._id, name: catObj.name } : updatedExpense.category || e.category };
          })
        );

        // Refresh cash entries because changing an expense date/amount may affect daily cash calculations
        await fetchCashEntries();
        setCashSavedMessage("");
        handleCancelEdit();
      } else {
        const errText = typeof parsed === "string" ? parsed : JSON.stringify(parsed);
        alert("Failed to update expense: " + errText);
      }
    } catch (err) {
      console.error("Failed to save expense:", err);
      alert("Failed to update expense");
    }
  };

  const handleCancelEdit = useCallback(() => {
    setEditingExpenseId(null);
    setEditedAmount("");
    setEditedDate("");
    setEditedTitle("");
    setEditedCategory("");
  }, []);

  // -------------------------
  // Delete handlers
  // -------------------------
  const openDeleteModal = useCallback((expense) => {
    setToDeleteExpense(expense);
    setDeleteModalOpen(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setToDeleteExpense(null);
    setDeleteModalOpen(false);
  }, []);

  const confirmDeleteExpense = useCallback(async () => {
    if (!toDeleteExpense) return;
    setDeleting(true);
    setExpenses((prev) => prev.filter((e) => e._id !== toDeleteExpense._id));
    try {
      const res = await fetch(`/api/expenses/${toDeleteExpense._id}`, { method: "DELETE" });
      // always re-fetch to ensure consistency
      await fetchExpenses();
      await fetchCashEntries();
    } catch (err) {
      console.error("Delete failed:", err);
      await fetchExpenses();
    } finally {
      setDeleting(false);
      closeDeleteModal();
    }
  }, [toDeleteExpense]);

  // -------------------------
  // Memoized lists
  // -------------------------
  const filteredExpenses = useMemo(() => {
    const list = (expenses || []).filter((entry) => {
      if (staffData?.role !== "admin") {
        if (entry.location !== staffData?.location) return false;
      } else if (selectedLocation !== "All" && entry.location !== selectedLocation) return false;

      if (filterDate) {
        const entryDate = entry.date || entry.createdAt;
        if (!matchDate(entryDate, filterDate)) return false;
      }

      // period/specific/custom filter
      if (filters.startDate && filters.endDate) {
        const start = new Date(filters.startDate);
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        const d = new Date(entry.date || entry.createdAt);
        if (d < start || d > end) return false;
      } else if (filters.selectedDate) {
        const dStr = new Date(entry.date || entry.createdAt).toISOString().split("T")[0];
        if (dStr !== filters.selectedDate) return false;
      }

      return true;
    });

    return list.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
  }, [expenses, staffData, selectedLocation, filterDate, filters.startDate, filters.endDate, filters.selectedDate]);

  const filteredCashEntries = useMemo(() => {
    const list = (cashEntries || []).filter((entry) => {
      if (staffData?.role !== "admin") {
        if (entry.location !== staffData?.location) return false;
      } else if (selectedLocation !== "All" && entry.location !== selectedLocation) return false;

      if (filterDate && !matchDate(entry.date, filterDate)) return false;

      // Respect period/specific/custom filters for cash entries too:
      if (filters.startDate && filters.endDate) {
        const start = new Date(filters.startDate);
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        const d = new Date(entry.date);
        if (d < start || d > end) return false;
      } else if (filters.selectedDate) {
        const dStr = new Date(entry.date).toISOString().split("T")[0];
        if (dStr !== filters.selectedDate) return false;
      }

      return true;
    });

    return list.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
  }, [cashEntries, staffData, selectedLocation, filterDate, filters.startDate, filters.endDate, filters.selectedDate]);

  const locations = useMemo(() => Array.from(new Set(expenses.map((e) => e.location))).filter(Boolean), [expenses]);

  // -------------------------
  // Render
  // -------------------------
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-10 transition-all">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <header className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 border-b border-blue-100 pb-4">
            <div>
              <h1 className="text-3xl font-bold text-blue-800 tracking-tight">Expense Management</h1>
              <p className="text-sm text-gray-500 mt-1">Manage expenses and daily cash. Edit items inline by admins.</p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 text-sm text-blue-900 shadow-sm">
              <p className="whitespace-nowrap">
                <span className="font-semibold">Logged in:</span> {staffData?.name || "—"} &nbsp;|&nbsp;
                <span className="font-semibold">Location:</span> {staffData?.location || "—"}
              </p>

              {staffData?.role === "admin" && (
                <div className="flex items-center gap-2">
                  <label htmlFor="locationFilter" className="text-gray-700 font-medium">Location:</label>
                  <select id="locationFilter" value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm">
                    <option value="All">All</option>
                    {locations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2">
                <label htmlFor="dateFilter" className="text-gray-700 font-medium">Date:</label>
                <input id="dateFilter" type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm" />
                <button onClick={() => setFilterDate("")} className="text-xs px-2 py-1 bg-gray-100 rounded-md hover:bg-gray-200" title="Clear date filter">Clear</button>
              </div>
            </div>
          </header>

          {/* Cash Input */}
          <section className="bg-white rounded-xl border border-blue-100 shadow-md p-6 hover:shadow-lg transition-all">
            <h2 className="text-lg font-semibold text-blue-700 mb-4">Add Cash for the Day</h2>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <input type="date" value={cashDate} onChange={(e) => setCashDate(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg w-full sm:w-1/3 focus:ring-2 focus:ring-blue-400" />
              <input type="number" placeholder="Enter cash amount" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg w-full sm:w-1/3 focus:ring-2 focus:ring-blue-400" />
              <button onClick={handleSaveCash} disabled={savingCash} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold shadow-md transition-all disabled:opacity-50">{savingCash ? "Saving..." : "Save"}</button>
            </div>
            {cashSavedMessage && (
              <div className="flex items-center gap-2 mt-4 text-green-600 font-medium">
                <CheckCircle className="w-4 h-4" />
                {cashSavedMessage}
              </div>
            )}
          </section>

          {/* Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Add Expense Form */}
            <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-md hover:shadow-lg transition-all">
              <h2 className="text-xl font-semibold text-blue-700 mb-4">Add New Expense</h2>
              <ExpenseForm
                onSaved={async () => {
                  await fetchExpenses();
                  await fetchCategories();
                  await fetchCashEntries();
                }}
                staffId={staffData?._id}
                staffName={staffData?.name}
                location={staffData?.location}
                categoryApi="/api/expense-category/expense-category"
              />
            </div>

            <div className="col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Expenses */}
                <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-lg flex flex-col overflow-hidden">
                  <div className="flex justify-between items-center mb-4 sticky top-0 bg-white z-10 pb-2 border-b border-blue-50">
                    <h2 className="text-xl font-bold text-blue-700 flex items-center gap-2"><CircleDollarSign className="w-5 h-5 text-green-600" /> Recent Expenses</h2>
                    <span className="text-sm text-gray-500">{expenses.length} total</span>
                  </div>

                  {/* Scrollable list (scrollbars hidden via CSS class 'scrollbar-hide' you already use) */}
                  <div className="overflow-y-auto scrollbar-hide flex-grow min-h-[400px] max-h-[75vh] pr-2 space-y-4">
                    {filteredExpenses.map((exp) => (
                        <div key={exp._id} className="bg-gray-50 hover:bg-gray-100 transition-all border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md">
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                              {editingExpenseId === exp._id ? (
                                <input type="text" value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} className="border px-2 py-1 rounded-md text-sm w-full focus:ring-2 focus:ring-blue-400" placeholder="Expense title" />
                              ) : (
                                <h3 className="font-semibold text-gray-800 text-base">{exp.title}</h3>
                              )}

                              <div className="mt-1 flex items-center flex-wrap gap-2 text-xs text-gray-500">
                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-gray-400" />{exp.location || "—"}</span>
                                <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3 text-gray-400" />{formatDateDDMMYYYY(exp.date || exp.createdAt)}</span>
                              </div>
                            </div>

                            <div className="text-right">
                              {editingExpenseId === exp._id ? (
                                <div className="flex flex-col items-end gap-2">
                                  <input type="number" value={editedAmount} onChange={(e) => setEditedAmount(e.target.value)} className="border px-2 py-1 rounded-md text-sm w-28 focus:ring-2 focus:ring-blue-400" />
                                  <input type="date" value={editedDate} onChange={(e) => setEditedDate(e.target.value)} className="border px-2 py-1 rounded-md text-sm w-36 focus:ring-2 focus:ring-blue-400" />
                                  <div className="flex gap-2 mt-2">
                                    <button onClick={() => handleSaveExpense(exp)} className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded-md">Save</button>
                                    <button onClick={handleCancelEdit} className="bg-gray-300 hover:bg-gray-400 text-gray-700 text-xs px-3 py-1 rounded-md">Cancel</button>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-green-700 font-semibold text-sm">{formatCurrency(exp.amount)}</span>
                              )}
                            </div>
                          </div>

                          <div className="mt-3 flex justify-between items-center text-xs text-gray-600">
                            {editingExpenseId === exp._id ? (
                              <select value={editedCategory} onChange={(e) => setEditedCategory(e.target.value)} className="px-2 py-1 border rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-400">
                                <option value="">Select category</option>
                                {categories.map((c) => <option key={c._1} value={c._id}>{c.name}</option>)}
                              </select>
                            ) : (
                              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium uppercase">{exp?.category?.name || "Uncategorized"}</span>
                            )}

                            <span className="text-gray-400">Entered by: <span className="font-medium text-gray-700">{typeof exp.staff === "string" ? exp.staff : exp.staff?.name || "—"}</span></span>
                          </div>

                          {editingExpenseId !== exp._id && staffData?.role === "admin" && (
                            <div className="mt-3 flex justify-end gap-2">
                              <button onClick={() => handleEditExpense(exp)} className="text-xs text-blue-600 border border-blue-500 hover:bg-blue-500 hover:text-white transition-all px-3 py-1 rounded-md">Edit</button>
                              <button onClick={() => openDeleteModal(exp)} className="text-xs text-red-600 border border-red-400 hover:bg-red-500 hover:text-white transition-all px-3 py-1 rounded-md">Delete</button>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>

                {/* Cash Entries (inline editing enabled) */}
                <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-lg flex flex-col overflow-hidden">
                  <div className="flex justify-between items-center mb-4 sticky top-0 bg-white z-10 pb-2 border-b border-blue-50">
                    <h2 className="text-xl font-bold text-blue-700 flex items-center gap-2"><CircleDollarSign className="w-5 h-5 text-green-600" /> Daily Cash Entries</h2>
                    <span className="text-sm text-gray-500">{cashEntries.length} total</span>
                  </div>

                  <div className="overflow-y-auto scrollbar-hide flex-grow max-h-[75vh] pr-2 space-y-4">
                    {filteredCashEntries.map((entry) => (
                        <div key={entry._id} className="bg-gray-50 hover:bg-gray-100 transition-all border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md">
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-800 text-base flex items-center gap-2"><CircleDollarSign className="w-4 h-4 text-green-500" /> Daily Cash</h3>
                              <div className="mt-1 flex items-center flex-wrap gap-2 text-xs text-gray-500">
                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-gray-400" />{entry.location || "—"}</span>
                                <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3 text-gray-400" />{formatDateDDMMYYYY(entry.date)}</span>
                              </div>
                            </div>

                            <div className="text-right">
                              {editingCashId === entry._id ? (
                                <div className="flex flex-col items-end gap-2">
                                  <input type="number" value={editedCashAmount} onChange={(e) => setEditedCashAmount(e.target.value)} className="border px-2 py-1 rounded-md text-sm w-28 focus:ring-2 focus:ring-blue-400" />
                                  <input type="date" value={editedCashDate} onChange={(e) => setEditedCashDate(e.target.value)} className="border px-2 py-1 rounded-md text-sm w-36 focus:ring-2 focus:ring-blue-400" />
                                  <div className="flex gap-2 mt-2">
                                    <button onClick={() => handleSaveCashInline(entry)} className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded-md">Save</button>
                                    <button onClick={handleCancelCashEdit} className="bg-gray-300 hover:bg-gray-400 text-gray-700 text-xs px-3 py-1 rounded-md">Cancel</button>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-green-700 font-semibold text-sm">{formatCurrency(entry.amount)}</span>
                              )}
                            </div>
                          </div>

                          <div className="mt-3 flex justify-between items-center text-xs text-gray-600">
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium uppercase">CASH ENTRY</span>
                            <span className="text-gray-400">Entered by: <span className="font-medium text-gray-700">{entry.staff?.name || "—"}</span></span>
                          </div>

                          {editingCashId !== entry._id && staffData?.role === "admin" && (
                            <div className="mt-3 flex justify-end">
                              <button onClick={() => handleEditCashInline(entry)} className="text-xs text-blue-600 border border-blue-500 hover:bg-blue-500 hover:text-white transition-all px-3 py-1 rounded-md">Edit</button>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Delete modal */}
        <DeleteConfirm
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={confirmDeleteExpense}
          title="Delete expense"
          description={toDeleteExpense ? `Are you sure you want to delete "${toDeleteExpense.title}"? This action cannot be undone.` : "Are you sure you want to delete this item?"}
          confirmText="Delete"
          processing={deleting}
        />
      </div>
    </Layout>
  );
}
