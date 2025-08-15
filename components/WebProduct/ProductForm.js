// components/WebProduct/ProductForm.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

export default function ProductForm({ selectedProduct, onClear, onSaved }) {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock: "",
    category: "",
    images: [],
    description: "",
  });
  const [loading, setLoading] = useState(false);

  // Load form data when editing OR reset when creating
  useEffect(() => {
    if (selectedProduct) {
      setFormData({
        name: selectedProduct.name || "",
        price: selectedProduct.price || "",
        stock: selectedProduct.stock || "",
        category: selectedProduct.category || "",
        images: selectedProduct.images || (selectedProduct.image ? [selectedProduct.image] : []),
        description: selectedProduct.description || "",
      });
    } else {
      setFormData({
        name: "",
        price: "",
        stock: "",
        category: "",
        images: [],
        description: "",
      });
    }
  }, [selectedProduct]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isEdit = Boolean(selectedProduct?._id);
    const url = isEdit ? `/api/web-products/${selectedProduct._id}` : "/api/web-products";
    const method = isEdit ? "PATCH" : "POST";

    // Ensure images is an array
    const payload = { ...formData, images: Array.isArray(formData.images) ? formData.images : [] };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save product");

      const savedProduct = await res.json();
      onSaved?.(savedProduct);
    } catch (err) {
      console.error(err);
      alert("Error saving product");
    }
  };

  // Upload images
  async function uploadImages(ev) {
    const imgFiles = ev.target?.files;
    if (imgFiles?.length > 0) {
      setLoading(true);
      const data = new FormData();
      for (const file of imgFiles) data.append("file", file);

      // If editing, let the server push new links into DB immediately
      if (selectedProduct?._id) {
        data.append("productId", selectedProduct._id);
      }

      try {
        const res = await axios.post("/api/web-products/upload", data);

        // When editing: API returns full updated product; mirror it locally
        if (res.data?.product) {
          const serverImages = res.data.product.images || [];
          setFormData((prev) => ({ ...prev, images: serverImages }));
        } else {
          // Creating: API returns just uploaded links; append to form state
          const uploaded = res.data?.links || [];
          setFormData((prev) => ({ ...prev, images: [...prev.images, ...uploaded] }));
        }
      } catch (err) {
        console.error("Image upload error", err);
        alert("Image upload failed");
      } finally {
        setLoading(false);
      }
    }
  }

  function removeImage(link) {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((img) => img !== link),
    }));
  }

  return (
   <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-md max-w-2xl mx-auto">
  <h3 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-2">
    {selectedProduct ? "Edit Product" : "Add Product"}
  </h3>

  {/* Name & Price */}
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <input
      name="name"
      value={formData.name}
      onChange={handleChange}
      placeholder="Product Name"
      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
      required
    />
    <input
      name="price"
      type="number"
      value={formData.price}
      onChange={handleChange}
      placeholder="Price"
      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
      required
    />
  </div>

  {/* Stock & Category */}
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <input
      name="stock"
      type="number"
      value={formData.stock}
      onChange={handleChange}
      placeholder="Stock Quantity"
      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
    />
    <input
      name="category"
      value={formData.category}
      onChange={handleChange}
      placeholder="Category"
      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
    />
  </div>

  {/* Description */}
  <textarea
    name="description"
    value={formData.description}
    onChange={handleChange}
    placeholder="Description"
    rows={4}
    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
  />

  {/* Image Upload Section */}
  <div>
    <label className="block text-gray-700 font-medium mb-2">Product Images</label>
    <div className="flex flex-wrap gap-3">
      <label className="w-28 h-28 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg text-gray-500 cursor-pointer hover:border-blue-400 hover:text-blue-500 transition-all duration-200">
        <span className="text-center">+ Upload</span>
        <input type="file" onChange={uploadImages} className="hidden" multiple />
      </label>

      {formData.images.map((link) => (
        <div key={link} className="relative w-28 h-28 rounded-lg overflow-hidden shadow-sm border">
          <img src={link} alt="Product" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => removeImage(link)}
            className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition"
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </div>
      ))}

      {loading && (
        <div className="w-28 h-28 flex items-center justify-center border rounded-lg bg-gray-100">
          <span className="text-gray-500 text-sm">Uploading...</span>
        </div>
      )}
    </div>
  </div>

  {/* Action Buttons */}
  <div className="flex flex-col sm:flex-row gap-3 mt-4">
    <button
      type="submit"
      className="flex-1 bg-blue-600 text-white px-5 py-3 rounded-lg font-medium hover:bg-blue-700 transition-all duration-200"
    >
      {selectedProduct ? "Update Product" : "Add Product"}
    </button>
    <button
      type="button"
      onClick={onClear}
      className="flex-1 bg-gray-400 text-white px-5 py-3 rounded-lg font-medium hover:bg-gray-500 transition-all duration-200"
    >
      {selectedProduct ? "Cancel" : "Close"}
    </button>
  </div>
</form>

  );
}
