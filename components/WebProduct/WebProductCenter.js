import React, { useState, useEffect } from "react";
import ProductForm from "@/components/WebProduct/ProductForm";
import ProductList from "@/components/WebProduct/ProductList";
import ProductStats from "@/components/WebProduct/ProductStats";

export default function WebProductCenter() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [query, setQuery] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [csvError, setCsvError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Load cached products first
  useEffect(() => {
    const cachedData = localStorage.getItem("webProducts");
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        setProducts(parsed);
      } catch (err) {
        console.error("Invalid cache format, clearing...");
        localStorage.removeItem("webProducts");
      }
    }
  }, []);

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);

        // Cache busting if it's a refresh after CSV upload
        const res = await fetch(`/api/web-products/web-products?ts=${Date.now()}`);
        const data = await res.json();

        // Save to state and cache
        setProducts(data);
        localStorage.setItem("webProducts", JSON.stringify(data));
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoadingProducts(false);
      }
    };

    // Only fetch if refresh triggered OR no cache
    if (refreshTrigger > 0 || !localStorage.getItem("webProducts")) {
      fetchProducts();
    }
  }, [refreshTrigger]);

  // Filter search
  useEffect(() => {
    if (!query) {
      setFilteredProducts(products);
    } else {
      const lowerQuery = query.toLowerCase();
      const result = products.filter((product) =>
        product.name.toLowerCase().includes(lowerQuery)
      );
      setFilteredProducts(result);
    }
  }, [query, products]);

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setShowForm(true);
  };

  const handleClearSelection = () => {
    setSelectedProduct(null);
  };

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // Disable scroll when modal open
  useEffect(() => {
    document.body.style.overflow = showForm ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showForm]);

  const handleCSVUpload = (e) => {
    setCsvError("");
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("csvFile", file);

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/web-products/import", true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      };

      xhr.onload = () => {
        setIsUploading(false);
        if (xhr.status >= 200 && xhr.status < 300) {
          // Trigger a real fetch to update both UI & cache
          triggerRefresh();
        } else {
          setCsvError("CSV upload failed. Ensure the file is valid.");
        }
      };

      xhr.onerror = () => {
        setIsUploading(false);
        setCsvError("An error occurred during CSV upload.");
      };

      xhr.send(formData);
    } catch (error) {
      console.error("Upload error:", error);
      setCsvError("An error occurred during CSV upload.");
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-xl p-6 space-y-8 border border-blue-200">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-3xl font-bold text-blue-800">
            Web Product Center
          </h1>

          <div className="flex flex-col gap-1 w-full md:w-auto">
            <div className="flex gap-3">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow-md font-semibold transition"
                onClick={() => setShowForm(true)}
              >
                + Add Product
              </button>

              <label className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg shadow-md font-semibold cursor-pointer transition">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="hidden"
                />
                Upload CSV
              </label>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}

            {csvError && (
              <p className="text-sm text-red-600 mt-2 max-w-md">
                ⚠️ {csvError}
                <br />
                Expected header:
                <code className="bg-gray-100 px-2 py-1 rounded text-gray-800 inline-block mt-1">
                  name,price,description,category,image
                </code>
              </p>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex justify-end">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products..."
            className="px-4 py-2 w-full md:w-80 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="relative bg-white w-full max-w-2xl p-6 rounded-xl shadow-2xl border border-gray-200">
              <button
                className="absolute top-3 right-4 text-gray-400 hover:text-red-500 text-3xl font-bold"
                onClick={() => {
                  setShowForm(false);
                  handleClearSelection();
                }}
              >
                &times;
              </button>

              <ProductForm
                selectedProduct={selectedProduct}
                onClear={() => {
                  setShowForm(false);
                  handleClearSelection();
                }}
                onSaved={() => {
                  triggerRefresh();
                  setShowForm(false);
                  handleClearSelection();
                }}
              />
            </div>
          </div>
        )}

        {/* Product List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={showForm ? "lg:col-span-2" : "lg:col-span-3"}>
            {loadingProducts ? (
              <div className="flex flex-col items-center justify-center py-10">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-3 text-gray-500 text-sm">Loading products...</p>
              </div>
            ) : (
              <ProductList
                products={filteredProducts}
                onEdit={handleSelectProduct}
                onRefresh={triggerRefresh}
              />
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="pt-6 border-t border-gray-200">
          <ProductStats products={products} />
        </div>
      </div>
    </div>
  );
}
