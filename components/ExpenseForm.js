import { useEffect, useState } from "react";
import { Loader2, PlusCircle } from "lucide-react";

export default function ExpenseForm({location, onSaved, categoryApi = "/api/expenses/expense-category" }) {
 const [formData, setFormData] = useState({
  title: "",
  amount: "",
  category: "",
  description: "",
  location: location || "",
  staff: {
    _id: "",
    name: "",
    role: "",
    email: "",
  },
});




  const [customCategory, setCustomCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [isOtherCategory, setIsOtherCategory] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load staff location from localStorage
 useEffect(() => {
  const stored = localStorage.getItem("staff");
  if (stored) {
    const staff = JSON.parse(stored);
    setFormData((prev) => ({
      ...prev,
      location: staff.location || "",
      staff: {
        _id: staff._id,
        name: staff.name,
        role: staff.role,
        email: staff.email,
      },
    }));
  }
}, []);




  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch(categoryApi);
        const data = await res.json();
        setCategories(data);
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    }

    fetchCategories();
  }, [categoryApi]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "category") {
      setIsOtherCategory(value === "Other");
      if (value !== "Other") setCustomCategory("");
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let categoryToSave = formData.category;

    // Handle custom category creation
    if (isOtherCategory && customCategory) {
      const res = await fetch(categoryApi, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: customCategory }),
      });

      if (res.ok) {
        const updatedCats = await res.json();
        setCategories(updatedCats);

        const newCat = updatedCats.find((cat) => cat.name === customCategory)?._id;
        if (newCat) {
          categoryToSave = newCat;
        } else {
          alert("Failed to find new category after creation");
          setLoading(false);
          return;
        }
      } else {
        alert("Failed to create custom category");
        setLoading(false);
        return;
      }
    }

    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
  title: formData.title,
  amount: formData.amount,
  category: categoryToSave,
  description: formData.description,
  location: formData.location,
  staff: formData.staff,
  date: todayIso,
}),


    });

    if (res.ok) {
      setFormData({ title: "", amount: "", category: "", description: "", location: formData.location });
      setCustomCategory("");
      setIsOtherCategory(false);
      onSaved && onSaved();
    } else {
      alert("Failed to save expense");
    }

    setLoading(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-xl shadow-md space-y-5 border border-gray-200"
    >
      <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
        <PlusCircle className="w-5 h-5 text-blue-500" />
        Add New Expense
      </h2>

      {/* Title */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          className="w-full p-3 border border-gray-300 rounded-lg"
          placeholder="e.g., Diesel Purchase"
        />
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Amount (₦)</label>
        <input
          type="number"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          required
          className="w-full p-3 border border-gray-300 rounded-lg"
          placeholder="e.g., 25000"
        />
      </div>

      {/* Category */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Category</label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
          className="w-full p-3 border border-gray-300 rounded-lg bg-white"
        >
          <option value="" disabled>
            Select Category
          </option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Custom Category Input */}
      {isOtherCategory && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Enter Custom Category</label>
          <input
            type="text"
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            required
            className="w-full p-3 border border-gray-300 rounded-lg"
            placeholder="Enter your category"
          />
        </div>
      )}

      {/* Location (Read-only) */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Location</label>
        <input
          type="text"
          value={formData.location}
          readOnly
          className="w-full p-3 border border-gray-200 bg-gray-100 rounded-lg text-gray-600"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Description (Optional)</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="w-full p-3 border border-gray-300 rounded-lg"
          placeholder="Add any relevant notes..."
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center transition duration-200 disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin h-5 w-5 mr-2" />
            Saving...
          </>
        ) : (
          "Add Expense"
        )}
      </button>
    </form>
  );
}
