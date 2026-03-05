import React, { useState } from "react";
import Image from "next/image";
import { CheckCircle, XCircle } from "lucide-react";

export default function ProductList({ products, onRefresh, onAdvancedClick }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});

  const pageSize = 10;

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const res = await fetch(`/api/web-products/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      alert("Product deleted successfully");
      onRefresh?.();
    } catch (err) {
      console.error(err);
      alert("Failed to delete product");
    }
  };

  const handleEditClick = (product) => {
    setEditingId(product._id);
    setEditValues({ ...product }); // clone for inline edit
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({});
  };

  const handleInputChange = (e, field) => {
    const { value } = e.target;
    setEditValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (id) => {
    try {
      const res = await fetch(`/api/web-products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editValues),
      });

      if (!res.ok) throw new Error("Failed to update");
      alert("Product updated successfully");

      setEditingId(null);
      setEditValues({});
      onRefresh?.();
    } catch (err) {
      console.error(err);
      alert("Update failed");
    }
  };

  if (!products?.length) {
    return <p className="text-gray-500 text-center mt-6">No products found.</p>;
  }

  const totalPages = Math.ceil(products.length / pageSize);
  const paginatedProducts = products.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const pageNumbers = (() => {
    const pages = [];
    const maxVisiblePages = 10;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      const middleRange = 2;

      if (currentPage <= 5) {
        for (let i = 1; i <= 7; i++) pages.push(i);
        pages.push("...", totalPages);
      } else if (currentPage >= totalPages - 4) {
        pages.push(1, "...");
        for (let i = totalPages - 6; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1, "...");
        for (
          let i = currentPage - middleRange;
          i <= currentPage + middleRange;
          i++
        )
          pages.push(i);
        pages.push("...", totalPages);
      }
    }

    return pages;
  })();

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Mobile Card View */}
      <div className="block md:hidden divide-y divide-gray-200">
        {paginatedProducts.map((product) => {
          const isEditing = editingId === product._id;
          return (
            <div key={product._id} className="p-3 space-y-2">
              <div className="flex items-center gap-3">
                {Array.isArray(product.images) && product.images[0] ? (
                  <Image src={product.images[0]} alt={product.name} width={40} height={40} className="rounded-md object-cover" />
                ) : (
                  <div className="w-10 h-10 bg-gray-200 rounded-md flex items-center justify-center text-gray-500 text-xs shrink-0">N/A</div>
                )}
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <input value={editValues.name ?? ""} onChange={(e) => handleInputChange(e, "name")} className="border px-2 py-1 rounded text-sm w-full" />
                  ) : (
                    <p className="font-medium text-sm truncate">{product.name}</p>
                  )}
                  <p className="text-xs text-gray-500">{product.category || "N/A"}</p>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${(product.stock ?? 0) > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                  {(product.stock ?? 0) > 0 ? <><CheckCircle size={10} /> In Stock</> : <><XCircle size={10} /> Out</>}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Price: <span className="font-semibold text-gray-800">₦{(product.price ?? 0).toLocaleString()}</span></span>
                <span className="text-gray-600">Stock: <span className="font-semibold text-gray-800">{product.stock ?? 0}</span></span>
              </div>
              <div className="flex gap-2 pt-1">
                {isEditing ? (
                  <>
                    <button onClick={() => handleSave(product._id)} className="flex-1 px-2 py-1 rounded-md border border-green-600 text-green-600 text-xs hover:bg-green-100">Save</button>
                    <button onClick={handleCancel} className="flex-1 px-2 py-1 rounded-md border border-gray-600 text-gray-600 text-xs hover:bg-gray-200">Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleEditClick(product)} className="flex-1 px-2 py-1 rounded-md border border-blue-600 text-blue-600 text-xs hover:bg-blue-100">Edit</button>
                    <button onClick={() => onAdvancedClick?.(product)} className="flex-1 px-2 py-1 rounded-md border border-purple-600 text-purple-600 text-xs hover:bg-purple-100">Advanced</button>
                    <button onClick={() => handleDelete(product._id)} className="flex-1 px-2 py-1 rounded-md border border-red-600 text-red-600 text-xs hover:bg-red-100">Delete</button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
      <table className="min-w-full text-sm text-gray-800">
        <thead className="bg-gray-100 text-xs text-gray-600 uppercase tracking-wider">
          <tr>
            <th className="px-5 py-3 text-left rounded-tl-xl">Action</th>
            <th className="px-5 py-3 text-left">Image</th>
            <th className="px-5 py-3 text-left">Name</th>
            <th className="px-5 py-3 text-left">Category</th>
            <th className="px-5 py-3 text-left">Price</th>
            <th className="px-5 py-3 text-left">Stock</th>
            <th className="px-5 py-3 text-left">Status</th>
            <th className="px-5 py-3 text-right rounded-tr-xl">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {paginatedProducts.map((product, idx) => {
            const isEditing = editingId === product._id;

            return (
              <tr
                key={product._id}
                className={
                  idx % 2 === 0 ? "bg-white" : "bg-gray-50 hover:bg-gray-100"
                }
              >
                <td className="px-5 py-4 text-right">
                  {isEditing ? (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleSave(product._id)}
                        className="px-3 py-1 rounded-md border border-green-600 text-green-600 hover:bg-green-100 transition duration-150"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className="px-3 py-1 rounded-md border border-gray-600 text-gray-600 hover:bg-gray-200 transition duration-150"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEditClick(product)}
                        className="px-3 py-1 rounded-md border border-blue-600 text-blue-600 hover:bg-blue-100 transition duration-150"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onAdvancedClick?.(product)}
                        className="px-3 py-1 rounded-md border border-purple-600 text-purple-600 hover:bg-purple-100"
                      >
                        Advanced
                      </button>
                    </div>
                  )}
                </td>

               <td className="px-5 py-4">
  {Array.isArray(product.images) && product.images[0] ? (
    <Image
      src={product.images[0]}
      alt={product.name}
      width={50}
      height={50}
      className="rounded-md object-cover"
    />
  ) : (
    <div className="w-12 h-12 bg-gray-200 rounded-md text-center flex items-center justify-center text-gray-500">
      N/A
    </div>
  )}
</td>

                <td className="px-5 py-4 font-medium">
                  {isEditing ? (
                    <input
                      value={editValues.name ?? ""}
                      onChange={(e) => handleInputChange(e, "name")}
                      className="border px-2 py-1 rounded w-full"
                    />
                  ) : (
                    product.name
                  )}
                </td>

                <td className="px-5 py-4">
                  {isEditing ? (
                    <input
                      value={editValues.category ?? ""}
                      onChange={(e) => handleInputChange(e, "category")}
                      className="border px-2 py-1 rounded w-full"
                    />
                  ) : (
                    product.category || "N/A"
                  )}
                </td>

                <td className="px-5 py-4">
                  {isEditing ? (
                    <input
                      type="number"
                      value={editValues.price ?? ""}
                      onChange={(e) => handleInputChange(e, "price")}
                      className="border px-2 py-1 rounded w-full"
                    />
                  ) : (
                    `₦${(product.price ?? 0).toLocaleString()}`
                  )}
                </td>

                <td className="px-5 py-4">
                  {isEditing ? (
                    <input
                      type="number"
                      value={editValues.stock ?? ""}
                      onChange={(e) => handleInputChange(e, "stock")}
                      className="border px-2 py-1 rounded w-full"
                    />
                  ) : (
                    product.stock ?? 0
                  )}
                </td>

                <td className="px-5 py-4">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                      (product.stock ?? 0) > 0
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {(product.stock ?? 0) > 0 ? (
                      <>
                        <CheckCircle size={14} />
                        In Stock
                      </>
                    ) : (
                      <>
                        <XCircle size={14} />
                        Out of Stock
                      </>
                    )}
                  </span>
                </td>

                <td className="px-5 py-4">
                  <button
                    onClick={() => handleDelete(product._id)}
                    className="px-3 py-1 rounded-md border border-red-600 text-red-600 hover:bg-red-100 transition duration-150"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-1 sm:gap-2 mt-4 sm:mt-6 mb-4 flex-wrap px-2 sm:px-4">
        {pageNumbers.map((num, index) =>
          num === "..." ? (
            <span
              key={index}
              className="px-3 py-1 text-gray-500 text-sm font-medium"
            >
              ...
            </span>
          ) : (
            <button
              key={index}
              onClick={() => setCurrentPage(num)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 ${
                currentPage === num
                  ? "bg-blue-600 text-white border-blue-600"
                  : "text-gray-700 border-gray-300 hover:bg-gray-100"
              }`}
            >
              {num}
            </button>
          )
        )}
        {currentPage < totalPages && (
          <button
            onClick={() => setCurrentPage((prev) => prev + 1)}
            className="px-4 py-1.5 rounded-full text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-100"
          >
            &raquo;
          </button>
        )}
      </div>
    </div>
  );
}
