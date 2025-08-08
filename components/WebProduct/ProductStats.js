// components/Product/ProductStats.jsx
import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ["#34d399", "#f87171", "#60a5fa", "#fbbf24", "#a78bfa", "#38bdf8"];

export default function ProductStats({ products }) {
  if (!products?.length) {
    return <p className="text-gray-500 text-center mt-6">No products to display stats.</p>;
  }

  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.price || 0) * (p.stock || 0), 0);
  const outOfStockCount = products.filter(p => (p.stock || 0) <= 0).length;

  const categoryData = Object.entries(
    products.reduce((acc, product) => {
      const cat = product.category || "Uncategorized";
      acc[cat] = (acc[cat] || 0) + (product.stock || 0);
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mt-6 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
        <div className="bg-gray-50 rounded p-4">
          <p className="text-sm text-gray-500">Total Products</p>
          <p className="text-xl font-semibold text-gray-800">{totalProducts}</p>
        </div>
        <div className="bg-gray-50 rounded p-4">
          <p className="text-sm text-gray-500">Total Stock</p>
          <p className="text-xl font-semibold text-green-600">{totalStock.toLocaleString()}</p>
        </div>
        <div className="bg-gray-50 rounded p-4">
          <p className="text-sm text-gray-500">Inventory Value</p>
          <p className="text-xl font-semibold text-blue-600">₦{totalInventoryValue.toLocaleString()}</p>
        </div>
        <div className="bg-gray-50 rounded p-4">
          <p className="text-sm text-gray-500">Out of Stock</p>
          <p className="text-xl font-semibold text-red-600">{outOfStockCount}</p>
        </div>
      </div>

      {categoryData.length > 1 && (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label
              >
                {categoryData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend layout="horizontal" verticalAlign="bottom" align="center" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
