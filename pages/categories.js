import Layout from "@/components/Layout";
import { Pencil, Check, PlusCircle, X } from "lucide-react";
import { useEffect, useState } from "react";

export default function Category() {
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [newCategory, setNewCategory] = useState("");
  const [editName, setEditName] = useState("");

  // Fetch categories
  const fetchCategories = async () => {
    const res = await fetch("/api/expense-category/expense-category");
    if (res.ok) {
      const data = await res.json();
      setCategories(data);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAdd = async () => {
    if (!newCategory.trim()) return;
    const res = await fetch("/api/expense-category/expense-category", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategory }),
    });
    if (res.ok) {
      setNewCategory("");
      fetchCategories();
    }
  };

  const handleSave = async (id) => {
    const res = await fetch(`/api/expense-category/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName }),
    });
    if (res.ok) {
      setEditingId(null);
      fetchCategories();
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-blue-800 mb-6">
            Expense Categories
          </h1>
          <p className="text-center text-gray-500 mb-8 text-sm sm:text-base">
            Create and manage categories to organize your business spending.
          </p>

          {/* Add New Category */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-10">
            <input
              type="text"
              placeholder="Enter category name"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAdd}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md flex items-center justify-center gap-2 transition w-full sm:w-auto"
              aria-label="Add new category"
            >
              <PlusCircle className="w-5 h-5" />
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>

          {/* Category List Table */}
          <div className="overflow-x-auto rounded-xl border border-blue-100 bg-blue-50 p-4 sm:p-6 shadow-inner">
            <table className="w-full text-sm min-w-[400px]">
              <thead>
                <tr className="text-blue-900 font-semibold border-b border-blue-200">
                  <th className="py-2 text-left">Category Name</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr
                    key={cat._id}
                    className="border-b last:border-0 hover:bg-blue-100/40 transition"
                  >
                    <td className="py-3 align-middle">
                      {editingId === cat._id ? (
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3 py-1 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                          autoFocus
                          aria-label="Edit category name"
                        />
                      ) : (
                        <span className="text-gray-800">{cat.name}</span>
                      )}
                    </td>
                    <td className="py-3 text-right align-middle">
                      <div className="flex justify-end gap-2 flex-wrap sm:flex-nowrap min-w-[130px]">
                        {editingId === cat._id ? (
                          <>
                            <button
                              onClick={() => handleSave(cat._id)}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md flex items-center gap-1 text-sm transition"
                              aria-label="Save category"
                            >
                              <Check className="w-4 h-4" />
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="bg-gray-300 hover:bg-gray-400 text-gray-900 px-3 py-1 rounded-md flex items-center gap-1 text-sm transition"
                              aria-label="Cancel editing"
                            >
                              <X className="w-4 h-4" />
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingId(cat._id);
                              setEditName(cat.name);
                            }}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md flex items-center gap-1 text-sm transition"
                            aria-label="Edit category"
                          >
                            <Pencil className="w-4 h-4" />
                            Edit
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {categories.length === 0 && (
              <p className="text-center text-sm text-gray-500 mt-6 animate-pulse">
                No categories available. Start by adding one above.
              </p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
