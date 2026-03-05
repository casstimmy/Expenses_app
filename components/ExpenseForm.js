// ...existing code...
import { useEffect, useState, useRef, useMemo } from "react";
import { Loader2, PlusCircle } from "lucide-react";

const EXPENSE_TITLE_SUGGESTIONS = [
  "Oven Fresh Bread","St Michael's Bread","Phirstz Bread","Wonda Bread","Adnah Bread",
  "Cway Table Water","Cway Refill","Cway Bottle Water","Aquadana Table Water","Nirvana Table Water","Purewater",
  "Pearlite Parfait","Lasgidi Parfait","Lasgidi Chips","Lasgidi Chin Chin","Crunch by Graccy Chips","Peerless Chips","Peerless Peanut",
  "Raw Squeeze Juice","Raw Squeeze Pineapple & Ginger","Everything by Ria Zobo","Eatnsmile Cake","Delish Cake","Delish Chin Chin",
  "Cedar Divine Yoghurt","Wilfred Yoghurt",
  "Egg Purchase","Black Bullet","Biscuits Purchase","Detergent Purchase","Detergent (Cleaning)","Cleaning Materials",
  "Nylon Purchase","POS / Printer Paper Purchase","Kilishi Payment","Dailyfoods Garri","Rexona Groundnut",
  "Generator Repair","Generator Fix","Generator Parts Purchase","Generator Rental","Generator Transport",
  "Fridge Maintenance","Glass Repair (Deep Freezer)","AC Maintenance","Electrician","Electrical Fix","Fan Purchase","Battery Charger Purchase","Bulb Purchase","Wire / Clip / Nail Purchase","Suckaway Fix","Waste Disposal",
  "Data Purchase","Data Purchase (Ibile 1)","Data Purchase (Ibile 2)","Data Purchase (Mr. Ay)",
  "Metre Credit","Diesel Purchase","Fuel Purchase",
  "Stock Movement","Stock Movement Balance","Transport Fare","Transport to Ibile 2","Transport to Market","Mr. Ay Transport Fare","Customer Delivery",
  "Customer Refund",
];

export default function ExpenseForm({
  location,
  onSaved,
  categoryApi = "/api/expense-category/expense-category",
  staffId,
  staffName,
}) {
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
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
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);
  const titleInputRef = useRef(null);

  const filteredSuggestions = useMemo(() => {
    const query = (formData.title || "").trim().toLowerCase();
    if (!query) return EXPENSE_TITLE_SUGGESTIONS;
    return EXPENSE_TITLE_SUGGESTIONS.filter((s) =>
      s.toLowerCase().includes(query)
    );
  }, [formData.title]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target) &&
        titleInputRef.current &&
        !titleInputRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load staff/location from localStorage or fallback to props
  useEffect(() => {
    const stored = localStorage.getItem("staff");
    if (stored) {
      try {
        const staff = JSON.parse(stored);
        setFormData((prev) => ({
          ...prev,
          location: staff.location || prev.location || location || "",
          staff: {
            _id: staff._id || staffId || "",
            name: staff.name || staffName || "",
            role: staff.role || "",
            email: staff.email || "",
          },
        }));
        return;
      } catch (err) {
        // fall through to use props
      }
    }

    setFormData((prev) => ({
      ...prev,
      location: prev.location || location || "",
      staff: {
        _id: prev.staff._id || staffId || "",
        name: prev.staff.name || staffName || "",
        role: prev.staff.role || "",
        email: prev.staff.email || "",
      },
    }));
  }, [location, staffId, staffName]);

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch(categoryApi);
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : []);
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

    try {
      // Basic validations
      if (!formData.title || !formData.title.trim()) {
        alert("Please enter a title");
        setLoading(false);
        return;
      }
      if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
        alert("Please enter a valid amount");
        setLoading(false);
        return;
      }

      // Handle custom category creation
      if (isOtherCategory && customCategory) {
        const resCat = await fetch(categoryApi, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: customCategory }),
        });

        if (resCat.ok) {
          const updatedCats = await resCat.json();
          setCategories(Array.isArray(updatedCats) ? updatedCats : []);
          const newCat =
            (Array.isArray(updatedCats)
              ? updatedCats.find((cat) => cat.name === customCategory)?._id
              : updatedCats?._id) || null;
          if (newCat) categoryToSave = newCat;
          else {
            alert("Failed to find new category after creation");
            setLoading(false);
            return;
          }
        } else {
          const txt = await resCat.text();
          alert("Failed to create custom category: " + txt);
          setLoading(false);
          return;
        }
      }

      if (!categoryToSave) {
        alert("Please select or create a category");
        setLoading(false);
        return;
      }

      if (!formData.location) {
        alert("Location is required");
        setLoading(false);
        return;
      }

      if (!formData.date) {
        alert("Date is required");
        setLoading(false);
        return;
      }

      const payload = {
        title: formData.title.trim(),
        amount: Number(formData.amount),
        category: categoryToSave,
        description: formData.description || "",
        location: formData.location,
        staff:
          formData.staff && (formData.staff._id || formData.staff.name)
            ? formData.staff
            : null,
        date: formData.date, // send YYYY-MM-DD (backend normalizes)
      };

      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }

      if (res.ok) {
        setFormData((prev) => ({
          title: "",
          amount: "",
          category: "",
          description: "",
          date: new Date().toISOString().split("T")[0],
          location: prev.location || location || "",
          staff: prev.staff,
        }));
        setCustomCategory("");
        setIsOtherCategory(false);
        onSaved && onSaved();
      } else {
        console.error("Failed to save expense:", res.status, parsed);
        alert("Failed to save expense: " + (parsed?.error || parsed || res.status));
      }
    } catch (err) {
      console.error("Failed to save expense:", err);
      alert("Failed to save expense");
    } finally {
      setLoading(false);
    }
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
      <div className="space-y-2 relative">
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          ref={titleInputRef}
          type="text"
          name="title"
          value={formData.title}
          onChange={(e) => {
            handleChange(e);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          required
          autoComplete="off"
          className="w-full p-3 border border-gray-300 rounded-lg"
          placeholder="e.g., Diesel Purchase"
        />
        {showSuggestions && filteredSuggestions.length > 0 && (
          <ul
            ref={suggestionsRef}
            className="absolute z-20 left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg scrollbar-hide"
          >
            {filteredSuggestions.map((suggestion, i) => (
              <li
                key={i}
                onClick={() => {
                  setFormData((prev) => ({ ...prev, title: suggestion }));
                  setShowSuggestions(false);
                }}
                className="px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition-colors"
              >
                {suggestion}
              </li>
            ))}
          </ul>
        )}
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

      {/* Date */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Date</label>
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          required
          className="w-full p-3 border border-gray-300 rounded-lg"
        />
      </div>

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
