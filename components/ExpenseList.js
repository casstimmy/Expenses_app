// components/ExpenseList.js
import { FaFileExcel, FaFilePdf } from "react-icons/fa";

export default function ExpenseList({ sortedExpenses, exportToExcel, exportToPDF, report }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow border border-blue-100 overflow-auto">
      <h2 className="text-lg font-semibold text-blue-700 mb-4">All Expenses</h2>
      <ul className="space-y-3 max-h-[320px] overflow-y-auto pr-2">
        {sortedExpenses.map((exp) => (
          <li key={exp._id} className="flex flex-col border-b pb-2 border-gray-200">
            <span className="font-medium text-gray-800">{exp.title}</span>
            <span className="text-sm text-gray-600">
              ₦{Number(exp.amount).toLocaleString()} -{" "}
              {exp.category?.name || "Uncategorized"}{" "}
              {exp.location && `- ${exp.location}`}
            </span>
            <span className="text-xs text-gray-400">
              {new Date(exp.createdAt).toLocaleDateString()}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-3 items-center mt-4">
        <button
          onClick={exportToExcel}
          className="group relative flex items-center gap-2 px-4 py-1.5 rounded-lg border border-green-400 bg-white text-green-500 cursor-pointer text-sm font-medium shadow-sm transition duration-300 ease-in-out hover:bg-green-400 hover:text-white hover:shadow-md"
        >
          <FaFileExcel className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
          <span className="tracking-tight">Excel</span>
        </button>

        <button
          onClick={() => exportToPDF(sortedExpenses, report)}
          className="group relative flex items-center gap-2 px-4 py-1.5 rounded-lg border border-red-400 bg-white text-red-500 text-sm cursor-pointer font-medium shadow-sm transition duration-300 ease-in-out hover:bg-red-400 hover:text-white hover:shadow-md"
        >
          <FaFilePdf className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
          <span className="tracking-tight">PDF</span>
        </button>
      </div>
    </div>
  );
}
