// components/CategoryChart.js
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { BarChart2, PieChart as PieIcon } from "lucide-react";

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#6366F1",
  "#EC4899",
];

export default function CategoryChart({ chartData, showBarChart, setShowBarChart }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow border border-blue-100 relative">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-blue-700">
          Category Breakdown
        </h2>
        <button
          onClick={() => setShowBarChart(!showBarChart)}
          className="text-blue-600 hover:text-blue-800"
          title={showBarChart ? "Switch to Pie Chart" : "Switch to Bar Chart"}
        >
          {showBarChart ? (
            <PieIcon className="w-5 h-5" />
          ) : (
            <BarChart2 className="w-5 h-5" />
          )}
        </button>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        {showBarChart ? (
          <BarChart data={chartData}>
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip formatter={(value) => `₦${Number(value).toLocaleString()}`} />
            <Legend />
            <Bar dataKey="amount" fill="#3B82F6">
              {chartData.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        ) : (
          <PieChart>
            <Pie
              data={chartData}
              dataKey="amount"
              nameKey="category"
              cx="50%"
              cy="50%"
              outerRadius={110}
              label={({ name }) => name}
            >
              {chartData.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `₦${Number(value).toLocaleString()}`} />
            <Legend />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
