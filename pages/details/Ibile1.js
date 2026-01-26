import { useEffect, useState } from "react";
import Layout from "@/components/Layout";

export default function Ibile1Details() {
  const [expenses, setExpenses] = useState([]);
  const [cashRecords, setCashRecords] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  const [editingExpense, setEditingExpense] = useState(null);
  const [newExpense, setNewExpense] = useState({
    title: "",
    amount: "",
    category: "",
    date: "",
  });

  const itemsPerPage = 4;

  // ✅ FIX: Convert Date → YYYY-MM-DD (LOCAL SAFE)
  const toLocalDateString = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [expRes, cashRes, catRes] = await Promise.all([
          fetch("/api/expenses"),
          fetch("/api/daily-cash"),
          fetch("/api/expense-category/expense-category"),
        ]);

        const [expData, cashData, catData] = await Promise.all([
          expRes.json(),
          cashRes.json(),
          catRes.json(),
        ]);

        setExpenses(expData.filter((e) => e.location === "Ibile 1"));
        setCashRecords(cashData.filter((c) => c.location === "Ibile 1"));
        setCategories(catData);
      } catch (err) {
        console.error("❌ Failed to load Ibile 1 details:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Pagination
  const paginatedCash = cashRecords.slice(
    page * itemsPerPage,
    page * itemsPerPage + itemsPerPage
  );

  const getExpensesForDate = (date) =>
    expenses.filter((e) => {
      const expDate = new Date(e.date);
      const target = new Date(date);
      return (
        expDate.getFullYear() === target.getFullYear() &&
        expDate.getMonth() === target.getMonth() &&
        expDate.getDate() === target.getDate()
      );
    });

  // Expense CRUD
  const handleCreateExpense = async (cashEntry) => {
    if (!newExpense.title || !newExpense.amount || !newExpense.category) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newExpense.title,
          amount: Number(newExpense.amount),
          category: newExpense.category,

          // 🔐 CONTEXT — THIS IS THE KEY
          date: toLocalDateString(cashEntry.date),

          location: cashEntry.location || "Ibile 1",
          staff: cashEntry.staff || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to create expense");

      const created = await res.json();

      // Immediately reflect under the correct day
      setExpenses((prev) => [created, ...prev]);

      setNewExpense({ title: "", amount: "", category: "" });
    } catch (err) {
      console.error("❌ Expense create failed:", err);
      alert("Failed to add expense");
    }
  };

  const handleEditExpense = async () => {
    if (
      !editingExpense.title ||
      !editingExpense.amount ||
      !editingExpense.category
    ) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      const res = await fetch(`/api/expenses/${editingExpense._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editingExpense.title,
          amount: Number(editingExpense.amount),
          category: editingExpense.category,
          location: "Ibile 1",

          // ✅ FIX — USE EXPENSE DATE, NOT CASH ENTRY
          date: toLocalDateString(editingExpense.date),
        }),
      });

      if (!res.ok) throw new Error("Failed to update expense");

      const updated = await res.json();

      setExpenses((prev) =>
        prev.map((e) => (e._id === updated._id ? updated : e))
      );

      setEditingExpense(null);
    } catch (err) {
      console.error("❌ Expense update failed:", err);
      alert("Failed to update expense");
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!confirm("Delete this expense?")) return;

    try {
      const res = await fetch(`/api/expenses/${expenseId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete expense");

      setExpenses(expenses.filter((e) => e._id !== expenseId));
    } catch (err) {
      console.error("❌ Expense delete failed:", err);
      alert("Failed to delete expense");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6 text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-2 text-gray-600">Loading Ibile 1 records...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6 space-y-10">
        <div>
          <h1 className="text-3xl font-bold text-blue-800 mb-2">
            Ibile 1 Details
          </h1>
          <p className="text-gray-600">
            Manage daily cash and expenses for Ibile 1
          </p>
        </div>

        {/* Reports Grid */}
        {paginatedCash.length ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {paginatedCash.map((c, idx) => {
              const currentDate = new Date(c.date);
              const dailyExpenses = getExpensesForDate(currentDate);
              const totalExpensesForDay = dailyExpenses.reduce(
                (sum, e) => sum + Number(e.amount),
                0
              );
              const cashAtHand = Number(c.amount) - totalExpensesForDay;

              return (
                <div
                  key={c._id || idx}
                  className="bg-white shadow rounded-lg p-6 space-y-4"
                >
                  <div>
                    <h2 className="text-xl font-bold text-blue-700 mb-1">
                      📊 End of Day Report
                    </h2>
                    <p className="text-sm text-gray-500">
                      Date: {currentDate.toLocaleDateString("en-NG")} |
                      Location: Ibile 1
                    </p>
                  </div>

                  {/* Summary Metrics */}
                  <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded text-sm">
                    <div>
                      <p className="text-gray-600">Cash Received</p>
                      <p className="text-lg font-bold text-blue-700">
                        ₦{Number(c.amount).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Expenses</p>
                      <p className="text-lg font-bold text-red-600">
                        ₦{totalExpensesForDay.toLocaleString()}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-600">Cash at Hand</p>
                      <p
                        className={`text-lg font-bold ${
                          cashAtHand < 0 ? "text-red-600" : "text-green-700"
                        }`}
                      >
                        ₦{cashAtHand.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Payments Section */}
                  <div>
                    <h3 className="text-md font-semibold mb-2">💸 Payments</h3>
                    <ul className="text-sm text-gray-700 divide-y border rounded overflow-hidden">
                      {dailyExpenses.length ? (
                        dailyExpenses.map((exp) =>
                          editingExpense?._id === exp._id ? (
                            <li
                              key={exp._id}
                              className="p-3 bg-blue-50 space-y-2"
                            >
                              <input
                                type="text"
                                value={editingExpense.title}
                                onChange={(e) =>
                                  setEditingExpense({
                                    ...editingExpense,
                                    title: e.target.value,
                                  })
                                }
                                placeholder="Title"
                                className="border p-2 rounded w-full text-sm"
                              />
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  value={editingExpense.amount}
                                  onChange={(e) =>
                                    setEditingExpense({
                                      ...editingExpense,
                                      amount: e.target.value,
                                    })
                                  }
                                  placeholder="Amount"
                                  className="border p-2 rounded flex-1 text-sm"
                                />
                                <select
                                  value={editingExpense.category}
                                  onChange={(e) =>
                                    setEditingExpense({
                                      ...editingExpense,
                                      category: e.target.value,
                                    })
                                  }
                                  className="border p-2 rounded flex-1 text-sm"
                                >
                                  <option value="">Select Category</option>
                                  {categories.map((cat) => (
                                    <option key={cat._id} value={cat._id}>
                                      {cat.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={handleEditExpense}
                                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingExpense(null)}
                                  className="px-3 py-1 bg-gray-400 hover:bg-gray-500 text-white rounded text-xs font-medium"
                                >
                                  Cancel
                                </button>
                              </div>
                            </li>
                          ) : (
                            <li
                              key={exp._id}
                              className="flex justify-between items-center p-3 hover:bg-gray-50"
                            >
                              <div className="flex-1">
                                <p className="font-medium">{exp.title}</p>
                                <p className="text-xs text-gray-500">
                                  {exp.category?.name || "Uncategorized"}
                                </p>
                              </div>
                              <span className="font-semibold text-blue-700 mr-3">
                                ₦{Number(exp.amount).toLocaleString()}
                              </span>
                              <div className="flex gap-1">
                                <button
                                  onClick={() =>
                                    setEditingExpense({
                                      ...exp,
                                      category: exp.category?._id || "",
                                    })
                                  }
                                  className="px-2 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-xs"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDeleteExpense(exp._id)}
                                  className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs"
                                >
                                  🗑️
                                </button>
                              </div>
                            </li>
                          )
                        )
                      ) : (
                        <li className="p-3 text-gray-400 italic text-center">
                          No expenses
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Add new expense */}
                  <div className="border-t pt-4 space-y-2">
                    <h4 className="font-semibold text-sm">Add Expense</h4>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Title"
                        value={newExpense.title}
                        onChange={(e) =>
                          setNewExpense({
                            ...newExpense,
                            title: e.target.value,
                          })
                        }
                        className="border p-2 rounded w-full text-sm"
                      />
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Amount"
                          value={newExpense.amount}
                          onChange={(e) =>
                            setNewExpense({
                              ...newExpense,
                              amount: e.target.value,
                            })
                          }
                          className="border p-2 rounded flex-1 text-sm"
                        />
                        <select
                          value={newExpense.category}
                          onChange={(e) =>
                            setNewExpense({
                              ...newExpense,
                              category: e.target.value,
                            })
                          }
                          className="border p-2 rounded flex-1 text-sm"
                        >
                          <option value="">Select Category</option>
                          {categories.map((cat) => (
                            <option key={cat._id} value={cat._id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={() => handleCreateExpense(c)}
                        className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-sm"
                      >
                        Add Expense
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-gray-500 italic py-10">
            No daily cash records for Ibile 1
          </div>
        )}

        {/* Pagination */}
        {cashRecords.length > itemsPerPage && (
          <div className="flex justify-between items-center mt-6">
            <button
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300 hover:bg-blue-700 transition"
            >
              ⬅ Prev
            </button>
            <span className="text-sm text-gray-600">
              Page {page + 1} of {Math.ceil(cashRecords.length / itemsPerPage)}
            </span>
            <button
              disabled={(page + 1) * itemsPerPage >= cashRecords.length}
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300 hover:bg-blue-700 transition"
            >
              Next ➡
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
