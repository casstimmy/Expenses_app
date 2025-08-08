// components/products/ProductForm.js
import React, { useState, useEffect } from "react";

export default function ProductForm({ selectedProduct, onClear, onSaved }) {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock: "",
    category: "",
  });

  useEffect(() => {
    if (selectedProduct) {
      setFormData(selectedProduct);
    }
  }, [selectedProduct]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = selectedProduct ? "PUT" : "POST";
    const url = selectedProduct ? `/api/products/${selectedProduct._id}` : "/api/products";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      onSaved();
      onClear();
      setFormData({ name: "", price: "", stock: "", category: "" });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-700 mb-2">
        {selectedProduct ? "Edit Product" : "Add Product"}
      </h3>
      <input
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="Product Name"
        className="w-full p-2 border rounded"
        required
      />
      <input
        name="price"
        type="number"
        value={formData.price}
        onChange={handleChange}
        placeholder="Price"
        className="w-full p-2 border rounded"
        required
      />
      <input
        name="stock"
        type="number"
        value={formData.stock}
        onChange={handleChange}
        placeholder="Stock"
        className="w-full p-2 border rounded"
        required
      />
      <input
        name="category"
        value={formData.category}
        onChange={handleChange}
        placeholder="Category"
        className="w-full p-2 border rounded"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {selectedProduct ? "Update" : "Add"} Product
        </button>
        {selectedProduct && (
          <button
            type="button"
            onClick={onClear}
            className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
