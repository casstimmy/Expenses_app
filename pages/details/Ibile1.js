import { useEffect, useState } from "react";
import Layout from "@/components/Layout";

export default function Ibile1Details() {
  const [expenses, setExpenses] = useState([]);
  const [cashRecords, setCashRecords] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  const [editingRecord, setEditingRecord] = useState(null);
  const [newRecord, setNewRecord] = useState({ date: "", amount: "" });

  const [editingExpense, setEditingExpense] = useState(null);
  const [newExpense, setNewExpense] = useState({
    title: "",
    amount: "",
    category: "",
    date: "",
  });

  const itemsPerPage = 4;

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
      const expDate = new Date(e.date || e.createdAt);
      const target = new Date(date);
      return (
        expDate.getFullYear() === target.getFullYear() &&
        expDate.getMonth() === target.getMonth() &&
        expDate.getDate() === target.getDate()
      );
    });

  // Expense CRUD
  const handleCreateExpense = async (date) => {
    try {
      // Normalize the date to midnight for consistency
      const normalizedDate = new Date(date);
      normalizedDate.setHours(0, 0, 0, 0);

      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newExpense,
          amount: Number(newExpense.amount),
          location: "Ibile 1",
          date: normalizedDate,
        }),
      });

      if (!res.ok) throw new Error("Failed to create expense");

      const created = await res.json();
      setExpenses([created, ...expenses]);
      setNewExpense({ title: "", amount: "", category: "", date: "" });
    } catch (err) {
      console.error("❌ Expense create failed:", err);
    }
  };

  const handleEditExpense = async () => {
    try {
      // Normalize edit date as well (if it exists)
      const normalizedDate = editingExpense.date
        ? new Date(editingExpense.date)
        : new Date();
      normalizedDate.setHours(0, 0, 0, 0);

      await fetch(`/api/expenses/${editingExpense._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editingExpense, date: normalizedDate }),
      });
      setExpenses(
        expenses.map((e) =>
          e._id === editingExpense._id
            ? { ...editingExpense, date: normalizedDate }
            : e
        )
      );
      setEditingExpense(null);
    } catch (err) {
      console.error("❌ Expense update failed:", err);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6 text-center">Loading Ibile 1 records...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6 space-y-10">
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
                  className="bg-white shadow rounded-lg p-6 relative"
                >
                  <h1 className="text-xl font-bold text-blue-700 mb-1">
                    📊 End of Day Report
                  </h1>
                  <p className="text-sm text-gray-500 mb-6">
                    Date: {currentDate.toLocaleDateString()} | Location: Ibile 1
                  </p>

                  {/* Payments Section */}
                  <h2 className="text-md font-semibold mb-2">💸 Payments</h2>
                  <ul className="text-sm text-gray-700 divide-y">
                    {dailyExpenses.length ? (
                      dailyExpenses.map((exp) =>
                        editingExpense?._id === exp._id ? (
                          <li key={exp._id} className="py-2">
                            <input
                              type="text"
                              value={editingExpense.title}
                              onChange={(e) =>
                                setEditingExpense({
                                  ...editingExpense,
                                  title: e.target.value,
                                })
                              }
                              className="border p-1 rounded w-1/3"
                            />
                            <input
                              type="number"
                              value={editingExpense.amount}
                              onChange={(e) =>
                                setEditingExpense({
                                  ...editingExpense,
                                  amount: e.target.value,
                                })
                              }
                              className="border p-1 rounded w-1/4 ml-2"
                            />
                            <select
                              value={editingExpense.category}
                              onChange={(e) =>
                                setEditingExpense({
                                  ...editingExpense,
                                  category: e.target.value,
                                })
                              }
                              className="border p-1 rounded w-1/3 ml-2"
                            >
                              <option value="">Select Category</option>
                              {categories.map((cat) => (
                                <option key={cat._id} value={cat._id}>
                                  {cat.name}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={handleEditExpense}
                              className="ml-2 px-2 py-1 bg-green-500 text-white rounded text-xs"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingExpense(null)}
                              className="ml-1 px-2 py-1 bg-gray-400 text-white rounded text-xs"
                            >
                              Cancel
                            </button>
                          </li>
                        ) : (
                          <li
                            key={exp._id}
                            className="flex justify-between py-1"
                          >
                            <span>
                              {exp.title}{" "}
                              <span className="text-xs text-gray-500">
                                ({exp.category?.name || "Uncategorized"})
                              </span>
                            </span>
                            <span>₦{Number(exp.amount).toLocaleString()}</span>
                            <button
                              onClick={() => setEditingExpense(exp)}
                              className="ml-2 px-2 py-1 bg-yellow-500 text-white rounded text-xs"
                            >
                              Edit
                            </button>
                          </li>
                        )
                      )
                    ) : (
                      <li className="py-2 text-gray-400 italic">No expenses</li>
                    )}
                  </ul>

                  {/* Add new expense */}
                  <div className="mt-3 flex gap-2">
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
                      className="border p-2 rounded flex-1"
                    />
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
                      className="border p-2 rounded flex-1"
                    />
                    <select
                      value={newExpense.category}
                      onChange={(e) =>
                        setNewExpense({
                          ...newExpense,
                          category: e.target.value,
                        })
                      }
                      className="border p-2 rounded flex-1"
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleCreateExpense(c.date)}
                      className="px-3 py-2 bg-blue-600 text-white rounded"
                    >
                      Add
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-gray-500 italic">
            No daily cash records for Ibile 1
          </div>
        )}

        {/* Pagination */}
        <div className="flex justify-between mt-6">
          <button
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            ⬅ Prev
          </button>
          <button
            disabled={(page + 1) * itemsPerPage >= cashRecords.length}
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Next ➡
          </button>
        </div>
      </div>
    </Layout>
  );
}
