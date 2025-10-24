// pages/manage/expenses.js
"use client";

import Layout from "@/components/Layout";
import ExpenseForm from "@/components/ExpenseForm";
import DeleteConfirm from "@/components/modals/DeleteConfirm";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  CalendarDays,
  CircleDollarSign,
  MapPin,
  CheckCircle,
} from "lucide-react";

export default function ManageExpenses() {
  const [staffData, setStaffData] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [cashEntries, setCashEntries] = useState([]);
  const [categories, setCategories] = useState([]);

  const [cashAmount, setCashAmount] = useState("");
  const [cashDate, setCashDate] = useState(
    new Date().toISOString().split("T")[0]
  );
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

  const router = useRouter();
  const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  // -------------------------
  // Utils
  // -------------------------
  const formatCurrency = (v) =>
    `₦${Math.round(Number(v) || 0).toLocaleString("en-NG")}`;

  const formatDateDDMMYYYY = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d)) return "—";
    return `${String(d.getDate()).padStart(2, "0")}/${String(
      d.getMonth() + 1
    ).padStart(2, "0")}/${d.getFullYear()}`;
  };

  const combineDateKeepTime = (dateOnlyString, originalIsoString) => {
    try {
      const [year, month, day] = dateOnlyString.split("-").map(Number);
      const orig = new Date(originalIsoString);
      if (isNaN(orig)) return new Date(year, month - 1, day).toISOString();
      return new Date(
        year,
        month - 1,
        day,
        orig.getHours(),
        orig.getMinutes(),
        orig.getSeconds(),
        orig.getMilliseconds()
      ).toISOString();
    } catch {
      return new Date(dateOnlyString).toISOString();
    }
  };

  const matchDate = (itemDate, targetDate) => {
    if (!targetDate) return true;
    if (!itemDate) return false;
    return new Date(itemDate).toISOString().split("T")[0] === targetDate;
  };

  const readCache = (key) => {
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed?.ts) return parsed?.data || null;
      if (Date.now() - parsed.ts > CACHE_TTL_MS) return parsed?.data || null;
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
        setExpenses(
          [...cached].sort(
            (a, b) =>
              new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
          )
        );

      const res = await fetch("/api/expenses", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const sorted = Array.isArray(data)
          ? data.sort(
              (a, b) =>
                new Date(b.createdAt || b.date) -
                new Date(a.createdAt || a.date)
            )
          : [];
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
      if (cached)
        setCashEntries(
          [...cached].sort((a, b) => new Date(b.date) - new Date(a.date))
        );

      const res = await fetch("/api/daily-cash", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const sorted = Array.isArray(data)
          ? data.sort((a, b) => new Date(b.date) - new Date(a.date))
          : [];
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

      const res = await fetch("/api/expense-category/expense-category", {
        cache: "no-store",
      });
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
    Promise.all([
      fetchExpenses(),
      fetchCashEntries(),
      fetchCategories(),
    ]).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // -------------------------
  // Cash handlers
  // -------------------------
  const handleSaveCash = async () => {
    if (!cashAmount || isNaN(cashAmount)) return;

    const existingEntry = cashEntries.find(
      (entry) =>
        new Date(entry.date).toISOString().split("T")[0] === cashDate &&
        entry.location === staffData.location
    );

    setSavingCash(true);
    if (existingEntry) {
      const res = await fetch(`/api/daily-cash/${existingEntry._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(cashAmount),
          date: cashDate,
          location: staffData.location,
          staff: staffData,
        }),
      });
      if (res.ok) setCashSavedMessage("Cash updated successfully!");
      else alert("Failed to update existing entry");
    } else {
      const res = await fetch("/api/daily-cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(cashAmount),
          date: cashDate,
          location: staffData.location,
          staff: staffData,
        }),
      });
      if (res.ok) setCashSavedMessage("Cash saved successfully!");
      else console.error("Failed to save daily cash");
    }
    setCashAmount("");
    fetchCashEntries();
    setTimeout(() => setCashSavedMessage(""), 3000);
    setSavingCash(false);
  };

  const handleEditCashInline = (entry) => {
    setEditingCashId(entry._id);
    setEditedCashAmount(entry.amount);
    setEditedCashDate(new Date(entry.date).toISOString().split("T")[0]);
  };

  const handleSaveCashInline = async (entry) => {
    try {
      const res = await fetch(`/api/daily-cash/${entry._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(editedCashAmount),
          date: editedCashDate,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCashEntries((prev) =>
          prev.map((c) => (c._id === updated._id ? updated : c))
        );
        handleCancelCashEdit();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelCashEdit = () => {
    setEditingCashId(null);
    setEditedCashAmount("");
    setEditedCashDate("");
  };

  // -------------------------
  // Expense handlers
  // -------------------------
  const handleEditExpense = (expense) => {
    setEditingExpenseId(expense._id);
    setEditedAmount(expense.amount);
    setEditedTitle(expense.title || "");
    setEditedCategory(expense?.category?._id || expense?.category || "");
    setEditedDate(
      new Date(expense.createdAt || expense.date || new Date())
        .toISOString()
        .split("T")[0]
    );
  };

  const handleSaveExpense = async (expense) => {
    const payload = {
      title: editedTitle ?? expense.title,
      amount: Number(editedAmount),
      category: editedCategory || expense?.category?._id || expense?.category,
      description: expense.description || "",
      location: expense.location || null,
      staffName: staffData?.name || "",
      createdAt: combineDateKeepTime(editedDate, expense.createdAt),
    };

    try {
      const res = await fetch(`/api/expenses/${expense._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setExpenses((prev) =>
          prev.map((e) => {
            if (e._id !== expense._id) return e;
            const catObj =
              categories.find(
                (c) => String(c._id) === String(payload.category)
              ) ||
              e.category ||
              null;
            return {
              ...e,
              ...payload,
              category: catObj
                ? { _id: catObj._id, name: catObj.name }
                : e.category,
            };
          })
        );
        handleCancelEdit();
      } else {
        const errText = await res.text();
        alert("Failed to update expense: " + errText);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update expense");
    }
  };

  const handleCancelEdit = () => {
    setEditingExpenseId(null);
    setEditedAmount("");
    setEditedDate("");
    setEditedTitle("");
    setEditedCategory("");
  };

  // -------------------------
  // Delete handlers
  // -------------------------
  const openDeleteModal = (expense) => {
    setToDeleteExpense(expense);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setToDeleteExpense(null);
    setDeleteModalOpen(false);
  };

  const confirmDeleteExpense = async () => {
    if (!toDeleteExpense) return;
    setDeleting(true);
    setExpenses((prev) => prev.filter((e) => e._id !== toDeleteExpense._id));
    try {
      const res = await fetch(`/api/expenses/${toDeleteExpense._id}`, {
        method: "DELETE",
      });
      if (!res.ok) fetchExpenses();
      else fetchExpenses();
    } catch {
      fetchExpenses();
    } finally {
      setDeleting(false);
      closeDeleteModal();
    }
  };

  const locations = Array.from(new Set(expenses.map((e) => e.location))).filter(
    Boolean
  );

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
              <h1 className="text-3xl font-bold text-blue-800 tracking-tight">
                Expense Management
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage expenses and daily cash. Edit items inline by admins.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 text-sm text-blue-900 shadow-sm">
              <p className="whitespace-nowrap">
                <span className="font-semibold">Logged in:</span>{" "}
                {staffData?.name || "—"} &nbsp;|&nbsp;
                <span className="font-semibold">Location:</span>{" "}
                {staffData?.location || "—"}
              </p>

              {staffData?.role === "admin" && (
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="locationFilter"
                    className="text-gray-700 font-medium"
                  >
                    Location:
                  </label>
                  <select
                    id="locationFilter"
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
                  >
                    <option value="All">All</option>
                    {locations.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2">
                <label
                  htmlFor="dateFilter"
                  className="text-gray-700 font-medium"
                >
                  Date:
                </label>
                <input
                  id="dateFilter"
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
                />
                <button
                  onClick={() => setFilterDate("")}
                  className="text-xs px-2 py-1 bg-gray-100 rounded-md hover:bg-gray-200"
                  title="Clear date filter"
                >
                  Clear
                </button>
              </div>
            </div>
          </header>

          {/* Cash Input */}
          <section className="bg-white rounded-xl border border-blue-100 shadow-md p-6 hover:shadow-lg transition-all">
            <h2 className="text-lg font-semibold text-blue-700 mb-4">
              Add Cash for the Day
            </h2>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <input
                type="date"
                value={cashDate}
                onChange={(e) => setCashDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg w-full sm:w-1/3 focus:ring-2 focus:ring-blue-400"
              />
              <input
                type="number"
                placeholder="Enter cash amount"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg w-full sm:w-1/3 focus:ring-2 focus:ring-blue-400"
              />
              <button
                onClick={handleSaveCash}
                disabled={savingCash}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold shadow-md transition-all disabled:opacity-50"
              >
                {savingCash ? "Saving..." : "Save"}
              </button>
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
              <h2 className="text-xl font-semibold text-blue-700 mb-4">
                Add New Expense
              </h2>
              <ExpenseForm
                onSaved={() => {
                  fetchExpenses();
                  fetchCategories();
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
                    <h2 className="text-xl font-bold text-blue-700 flex items-center gap-2">
                      <CircleDollarSign className="w-5 h-5 text-green-600" />{" "}
                      Recent Expenses
                    </h2>
                    <span className="text-sm text-gray-500">
                      {expenses.length} total
                    </span>
                  </div>

                  {/* Scrollable list with scrollbar hidden */}
                  <div className="overflow-y-auto scrollbar-hide flex-grow min-h-[400px] max-h-[75vh] pr-2 space-y-4">
                    {expenses
                      .filter((entry) => {
                        if (staffData?.role !== "admin") {
                          if (entry.location !== staffData?.location)
                            return false;
                        } else if (
                          selectedLocation !== "All" &&
                          entry.location !== selectedLocation
                        )
                          return false;

                        if (filterDate) {
                          const entryDate = entry.createdAt || entry.date;
                          if (!matchDate(entryDate, filterDate)) return false;
                        }
                        return true;
                      })
                      // ✅ Always sort by latest date first
                      .sort(
                        (a, b) =>
                          new Date(b.createdAt || b.date) -
                          new Date(a.createdAt || a.date)
                      )
                      .map((exp) => (
                        <div
                          key={exp._id}
                          className="bg-gray-50 hover:bg-gray-100 transition-all border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md"
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                              {editingExpenseId === exp._id ? (
                                <input
                                  type="text"
                                  value={editedTitle}
                                  onChange={(e) =>
                                    setEditedTitle(e.target.value)
                                  }
                                  className="border px-2 py-1 rounded-md text-sm w-full focus:ring-2 focus:ring-blue-400"
                                  placeholder="Expense title"
                                />
                              ) : (
                                <h3 className="font-semibold text-gray-800 text-base">
                                  {exp.title}
                                </h3>
                              )}

                              <div className="mt-1 flex items-center flex-wrap gap-2 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-gray-400" />
                                  {exp.location || "—"}
                                </span>
                                <span className="flex items-center gap-1">
                                  <CalendarDays className="w-3 h-3 text-gray-400" />
                                  {formatDateDDMMYYYY(
                                    exp.createdAt || exp.date
                                  )}
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              {editingExpenseId === exp._id ? (
                                <div className="flex flex-col items-end gap-2">
                                  <input
                                    type="number"
                                    value={editedAmount}
                                    onChange={(e) =>
                                      setEditedAmount(e.target.value)
                                    }
                                    className="border px-2 py-1 rounded-md text-sm w-28 focus:ring-2 focus:ring-blue-400"
                                  />
                                  <input
                                    type="date"
                                    value={editedDate}
                                    onChange={(e) =>
                                      setEditedDate(e.target.value)
                                    }
                                    className="border px-2 py-1 rounded-md text-sm w-36 focus:ring-2 focus:ring-blue-400"
                                  />
                                  <div className="flex gap-2 mt-2">
                                    <button
                                      onClick={() => handleSaveExpense(exp)}
                                      className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded-md"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={handleCancelEdit}
                                      className="bg-gray-300 hover:bg-gray-400 text-gray-700 text-xs px-3 py-1 rounded-md"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-green-700 font-semibold text-sm">
                                  {formatCurrency(exp.amount)}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="mt-3 flex justify-between items-center text-xs text-gray-600">
                            {editingExpenseId === exp._id ? (
                              <select
                                value={editedCategory}
                                onChange={(e) =>
                                  setEditedCategory(e.target.value)
                                }
                                className="px-2 py-1 border rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-400"
                              >
                                <option value="">Select category</option>
                                {categories.map((c) => (
                                  <option key={c._id} value={c._id}>
                                    {c.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium uppercase">
                                {exp?.category?.name || "Uncategorized"}
                              </span>
                            )}

                            <span className="text-gray-400">
                              Entered by:{" "}
                              <span className="font-medium text-gray-700">
                                {typeof exp.staff === "string"
                                  ? exp.staff
                                  : exp.staff?.name || "—"}
                              </span>
                            </span>
                          </div>

                          {editingExpenseId !== exp._id &&
                            staffData?.role === "admin" && (
                              <div className="mt-3 flex justify-end gap-2">
                                <button
                                  onClick={() => handleEditExpense(exp)}
                                  className="text-xs text-blue-600 border border-blue-500 hover:bg-blue-500 hover:text-white transition-all px-3 py-1 rounded-md"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => openDeleteModal(exp)}
                                  className="text-xs text-red-600 border border-red-400 hover:bg-red-500 hover:text-white transition-all px-3 py-1 rounded-md"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                        </div>
                      ))}
                  </div>
                </div>

                {/* Cash Entries (inline editing enabled) */}
                <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-lg flex flex-col overflow-hidden">
                  <div className="flex justify-between items-center mb-4 sticky top-0 bg-white z-10 pb-2 border-b border-blue-50">
                    <h2 className="text-xl font-bold text-blue-700 flex items-center gap-2">
                      <CircleDollarSign className="w-5 h-5 text-green-600" />
                      Daily Cash Entries
                    </h2>
                    <span className="text-sm text-gray-500">
                      {cashEntries.length} total
                    </span>
                  </div>

                  <div className="overflow-y-auto scrollbar-hide flex-grow max-h-[75vh] pr-2 space-y-4">
                    {cashEntries
                      .filter((entry) => {
                        if (staffData?.role !== "admin") {
                          if (entry.location !== staffData?.location)
                            return false;
                        } else if (
                          selectedLocation !== "All" &&
                          entry.location !== selectedLocation
                        )
                          return false;

                        if (filterDate) {
                          if (!matchDate(entry.date, filterDate)) return false;
                        }
                        return true;
                      })
                      .map((entry) => (
                        <div
                          key={entry._id}
                          className="bg-gray-50 hover:bg-gray-100 transition-all border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md"
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-800 text-base flex items-center gap-2">
                                <CircleDollarSign className="w-4 h-4 text-green-500" />
                                Daily Cash
                              </h3>

                              <div className="mt-1 flex items-center flex-wrap gap-2 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-gray-400" />
                                  {entry.location || "—"}
                                </span>
                                <span className="flex items-center gap-1">
                                  <CalendarDays className="w-3 h-3 text-gray-400" />
                                  {formatDateDDMMYYYY(entry.date)}
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              {editingCashId === entry._id ? (
                                <div className="flex flex-col items-end gap-2">
                                  <input
                                    type="number"
                                    value={editedCashAmount}
                                    onChange={(e) =>
                                      setEditedCashAmount(e.target.value)
                                    }
                                    className="border px-2 py-1 rounded-md text-sm w-28 focus:ring-2 focus:ring-blue-400"
                                  />
                                  <input
                                    type="date"
                                    value={editedCashDate}
                                    onChange={(e) =>
                                      setEditedCashDate(e.target.value)
                                    }
                                    className="border px-2 py-1 rounded-md text-sm w-36 focus:ring-2 focus:ring-blue-400"
                                  />
                                  <div className="flex gap-2 mt-2">
                                    <button
                                      onClick={() =>
                                        handleSaveCashInline(entry)
                                      }
                                      className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded-md"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={handleCancelCashEdit}
                                      className="bg-gray-300 hover:bg-gray-400 text-gray-700 text-xs px-3 py-1 rounded-md"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-green-700 font-semibold text-sm">
                                  {formatCurrency(entry.amount)}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="mt-3 flex justify-between items-center text-xs text-gray-600">
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium uppercase">
                              CASH ENTRY
                            </span>
                            <span className="text-gray-400">
                              Entered by:{" "}
                              <span className="font-medium text-gray-700">
                                {entry.staff?.name || "—"}
                              </span>
                            </span>
                          </div>

                          {editingCashId !== entry._id &&
                            staffData?.role === "admin" && (
                              <div className="mt-3 flex justify-end">
                                <button
                                  onClick={() => handleEditCashInline(entry)}
                                  className="text-xs text-blue-600 border border-blue-500 hover:bg-blue-500 hover:text-white transition-all px-3 py-1 rounded-md"
                                >
                                  Edit
                                </button>
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
          description={
            toDeleteExpense
              ? `Are you sure you want to delete "${toDeleteExpense.title}"? This action cannot be undone.`
              : "Are you sure you want to delete this item?"
          }
          confirmText="Delete"
          processing={deleting}
        />
      </div>
    </Layout>
  );
}
