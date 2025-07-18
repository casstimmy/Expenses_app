import { useState, useEffect } from "react";

const productCategories = [
  "Beverages",
  "Snacks",
  "Groceries",
  "Household",
  "Meat",
  "CLEANING & LAUNDRY",
  "Bakery",
  "Frozen Foods",
  "Drinks",
  "Dairy",
  "Personal Care",
];


const toPascalCase = (str) =>
  str.replace(/\w\S*/g, (word) =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  );



export default function VendorForm({ onSuccess, editingVendor = null }) {
  const [availableProducts, setAvailableProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => setAvailableProducts(data));
  }, []);

  const [form, setForm] = useState({
    companyName: "",
    vendorRep: "",
    repPhone: "",
    email: "",
    address: "",
    mainProduct: "",
    bankName: "",
    accountName: "",
    accountNumber: "",
    products: [{ product: "", name: "", category: "", price: 0 }],
  });

  useEffect(() => {
    if (editingVendor) {
      setForm({
        companyName: editingVendor.companyName || "",
        vendorRep: editingVendor.vendorRep || "",
        repPhone: editingVendor.repPhone || "",
        email: editingVendor.email || "",
        address: editingVendor.address || "",
        mainProduct: editingVendor.mainProduct || "",
        bankName: editingVendor.bankName || "",
        accountName: editingVendor.accountName || "",
        accountNumber: editingVendor.accountNumber || "",
        products: editingVendor.products.map((p) => ({
          product: p.product?._id || "",
          name: p.product?.name || "",
          category: p.product?.category || "",
          price: p.price || "",
        })),
      });
    }
  }, [editingVendor]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

 const handleProductChange = (index, field, value) => {
 const formattedValue =
  field === "name" || field === "category" ? toPascalCase(value) : value;


  setForm((prev) => {
    const updated = [...prev.products];
    updated[index] = { ...updated[index], [field]: formattedValue };
    return { ...prev, products: updated };
  });
};


  const addProduct = () => {
  setForm((prev) => ({
    ...prev,
    products: [
      ...prev.products,
      { product: "", name: "", category: "", price: 0 },
    ],
  }));
};

  const removeProduct = (index) => {
    const updated = [...form.products];
    updated.splice(index, 1);
    setForm({ ...form, products: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const method = editingVendor ? "PUT" : "POST";
    const endpoint = editingVendor
      ? `/api/vendors/${editingVendor._id}`
      : "/api/vendors";

    const formattedProducts = form.products.map((p) => ({
      product: p.product,
      name: p.name,
      category: p.category,
      price: parseFloat(p.price) || 0,
    }));

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, products: formattedProducts }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(`Vendor ${editingVendor ? "updated" : "created"} successfully!`);
        onSuccess && onSuccess();
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      console.error("Submission failed", err);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
  setForm((prev) => ({
    ...prev,
    products: [
      ...prev.products,
      { name: "", category: "", price: "", quantity: "" },
    ],
  }));
};


  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 p-6 bg-white rounded-xl border border-gray-200 shadow-md max-h-[80vh] overflow-y-auto"
    >
      {/* Vendor Information */}
      <div>
        <h2 className="text-xl font-semibold text-blue-700 mb-4">
          Vendor Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {["companyName", "vendorRep", "repPhone", "email"].map((field) => (
            <div key={field}>
              <label className="text-sm text-gray-700 mb-1 block">
                {field === "companyName"
                  ? "Company Name"
                  : field === "vendorRep"
                  ? "Representative"
                  : field === "repPhone"
                  ? "Phone Number"
                  : "Email"}
              </label>
              <input
                name={field}
                value={form[field]}
                onChange={handleChange}
                className="border p-3 rounded w-full"
                placeholder={`Enter ${field}`}
                required={field !== "email"}
                type={field === "email" ? "email" : "text"}
              />
            </div>
          ))}

          <div className="md:col-span-2">
            <label className="text-sm text-gray-700 mb-1 block">Address</label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              className="border p-3 rounded w-full"
              placeholder="Full Address"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm text-gray-700 mb-1 block">
              Main Product
            </label>
            <input
              name="mainProduct"
              value={form.mainProduct}
              onChange={handleChange}
              className="border p-3 rounded w-full"
              placeholder="e.g., Spaghetti, Sodas, Flour"
            />
          </div>
        </div>
      </div>

      {/* Bank Details */}
      <div>
        <h2 className="text-xl font-semibold text-blue-700 mb-4">
          Bank Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {["bankName", "accountName", "accountNumber"].map((field) => (
            <div key={field}>
              <label className="text-sm text-gray-700 mb-1 block">
                {field === "bankName"
                  ? "Bank Name"
                  : field === "accountName"
                  ? "Account Name"
                  : "Account Number"}
              </label>
              <input
                name={field}
                value={form[field]}
                onChange={handleChange}
                className="border p-3 rounded w-full"
                placeholder={`Enter ${field}`}
                required
              />
            </div>
          ))}
        </div>
      </div>

      {/* Supplied Products */}
      <div>
        <h2 className="text-xl font-semibold text-blue-700 mb-4">
          Products Supplied
        </h2>
       {form.products.map((product, index) => {
  const isCustom = !product.product;
  return (
    <div
      key={index}
      className="border border-gray-300 rounded-lg p-4 mb-4 shadow-sm bg-gray-50"
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium text-gray-700">Product #{index + 1}</h3>
        {index > 0 && (
          <button
            type="button"
            onClick={() => removeProduct(index)}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            ✕ Remove
          </button>
        )}
      </div>

      {/* Unified row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Product Selection or Custom Input */}
        <div>
          <label className="text-sm text-gray-700 mb-1 block">
            Product Name
          </label>
        <select
  value={product.product}
  onChange={(e) => {
    const val = e.target.value;
    handleProductChange(index, "product", val);
    if (val !== "custom") {
      const selected = availableProducts.find((p) => p._id === val);
      handleProductChange(index, "name", selected?.name || "");
      handleProductChange(index, "category", selected?.category || "");
    } else {
      handleProductChange(index, "name", "");
      handleProductChange(index, "category", "");
    }
  }}
  className="border p-3 rounded w-full"
  required={product.name.trim() === ""} // only required when name is empty
>
  <option value="">Select Existing Product</option>
  {availableProducts.map((p) => (
    <option key={p._id} value={p._id}>
      {p.name}
    </option>
  ))}
  <option value="custom">+ Add Custom Product</option>
</select>

        </div>

        {/* Category */}
        <div>
          <label className="text-sm text-gray-700 mb-1 block">Category</label>
          <select
            value={product.category}
            onChange={(e) =>
              handleProductChange(index, "category", e.target.value)
            }
            className="border p-3 rounded w-full"
            required
          >
            <option value="">Select Category</option>
            {productCategories.map((cat, i) => (
              <option key={i} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Cost Price */}
        <div>
          <label className="text-sm text-gray-700 mb-1 block">
            Cost Price (₦)
          </label>
          <input
            type="number"
            value={product.price || ""}
            onChange={(e) =>
              handleProductChange(
                index,
                "price",
                parseFloat(e.target.value) || 0
              )
            }
            placeholder="e.g., 500.00"
            className="border p-3 rounded w-full"
            step="0.01"
            min="0"
            required
            onWheel={(e) => e.target.blur()}
          />
        </div>
      </div>
                {/* Input for New Product Name */}
  <div>
  <label className="text-sm w-full text-gray-700 mb-1 block">New Product Name</label>
  <input
    type="text"
    value={product.name}
    onChange={(e) => {
      const name = e.target.value;
      handleProductChange(index, "name", name);
      if (name.trim() !== "" && product.product !== "custom") {
        handleProductChange(index, "product", "custom"); // auto-switch select to "custom"
        handleProductChange(index, "category", "");      // optionally clear category
      }
    }}
    placeholder="Enter new product name"
    className="border p-3 rounded w-full"
    required={product.product === "custom"} // only required if it's a custom product
  />
</div>

    </div>
  );
})}


    {(() => {
  const last = form.products[form.products.length - 1]; // Define `last` first
  const isLastComplete =
    (last.product || last.name) && last.category && parseFloat(last.price) > 0;

  return isLastComplete ? (
    <button
      type="button"
      className="text-blue-600 font-semibold text-sm mt-2"
      onClick={handleAddProduct}
    >
      + Add Another Product
    </button>
  ) : null;
})()}


      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={loading}
          className={`px-6 py-2 font-medium rounded transition ${
            loading
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {loading
            ? editingVendor
              ? "Updating..."
              : "Saving..."
            : editingVendor
            ? "Update Vendor"
            : "Save Vendor"}
        </button>
      </div>
    </form>
  );
}
