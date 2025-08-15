import React, { useState, useEffect, useMemo } from "react";
import ProductForm from "@/components/WebProduct/ProductForm";
import ProductList from "@/components/WebProduct/ProductList";
import ProductStats from "@/components/WebProduct/ProductStats";

export default function WebProductCenter() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const CACHE_KEY = "webProducts";
  const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes

  // Load products (cache first, fetch if stale or missing)
  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { timestamp, data } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          setProducts(data);
        }
      }

      // Always try to fetch fresh data in the background
      const res = await fetch(`/api/web-products?ts=${Date.now()}`);
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setProducts(data);
      localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Filtered products (memoized)
  const filteredProducts = useMemo(() => {
    if (!query) return products;
    const lowerQuery = query.toLowerCase();
    return products.filter((p) => (p.name || "").toLowerCase().includes(lowerQuery));
  }, [query, products]);

  const handleProductSaved = (savedProduct) => {
    setProducts((prev) => {
      const exists = prev.some((p) => p._id === savedProduct._id);
      const next = exists
        ? prev.map((p) => (p._id === savedProduct._id ? savedProduct : p))
        : [savedProduct, ...prev];
      localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: next }));
      return next;
    });
    setShowForm(false);
    setSelectedProduct(null);
  };

  const handleAdvancedClick = (product) => {
    setSelectedProduct(product);
    setShowForm(true);
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-xl p-6 space-y-8 border border-blue-200">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-3xl font-bold text-blue-800">Web Product Center</h1>
          <div className="flex gap-3">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow-md font-semibold transition"
              onClick={() => { setSelectedProduct(null); setShowForm(true); }}
            >
              + Add Product
            </button>
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
                onClick={() => { setShowForm(false); setSelectedProduct(null); }}
              >
                &times;
              </button>
              <ProductForm
                selectedProduct={selectedProduct}
                onClear={() => { setSelectedProduct(null); setShowForm(false); }}
                onSaved={handleProductSaved}
              />
            </div>
          </div>
        )}

        {/* Product List */}
        <div className={showForm ? "lg:col-span-2" : "lg:col-span-3"}>
          {loadingProducts ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="mt-3 text-gray-500 text-sm">Loading products...</p>
            </div>
          ) : (
            <ProductList
              products={filteredProducts}
              onRefresh={loadProducts}
              onAdvancedClick={handleAdvancedClick}
            />
          )}
        </div>

        {/* Stats */}
        <ProductStats products={products} />
      </div>
    </div>
  );
}
