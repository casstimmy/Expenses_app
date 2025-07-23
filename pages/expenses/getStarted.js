"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BarChart2,
  PieChart,
  Download,
  Sliders,
  Users,
  FileText,
  ShoppingCart,
  CreditCard,
  ActivitySquare,
  X,
} from "lucide-react";

const features = [
  {
    title: "Visual Expense Reports",
    icon: <PieChart className="text-blue-600 w-6 h-6" />,
    description: "Generate real-time pie and bar charts to understand spending patterns across locations, categories, and time periods.",
    fullDetails:
      "Our visual expense module allows managers to interpret data using interactive pie and bar charts. Users can filter by date range, location, or staff member. Graphs auto-update and can be exported.",
    images: ["/images/features/expense-charts-1.png", "/images/features/expense-charts-2.png"],
  },
  {
    title: "Detailed Expense Management",
    icon: <FileText className="text-red-600 w-6 h-6" />,
    description:
      "Record and categorize every business expense with notes, attachments, and tags for easy reference.",
    fullDetails:
      "Upload receipts, add custom tags, and assign expenses to individual staff or departments. Group spending into predefined or custom categories. Supports bulk uploads via Excel.",
    images: ["/images/features/expense-management.png"],
  },
  {
    title: "Stock Ordering System",
    icon: <ShoppingCart className="text-orange-600 w-6 h-6" />,
    description:
      "Place, track, and approve stock orders for any store location. Prevent over-ordering and ensure accurate replenishment.",
    fullDetails:
      "Managers can view low-stock alerts and submit new orders to suppliers. Order statuses include pending, approved, delivered. Includes a real-time view of stock per location.",
    images: ["/images/features/stock-ordering.png", "/images/features/stock-dashboard.png"],
  },
  {
    title: "Payment Tracker",
    icon: <CreditCard className="text-purple-600 w-6 h-6" />,
    description:
      "Track payments made to vendors, suppliers, or staff. Get alerts for unpaid orders and generate payment reconciliation reports.",
    fullDetails:
      "Each payment record includes amount, recipient, date, and status (pending, paid, overdue). Supports exporting filtered payment logs and integration with bank feeds.",
    images: ["/images/features/payment-tracking.png"],
  },
  {
    title: "Smart Filtering",
    icon: <Sliders className="text-green-600 w-6 h-6" />,
    description:
      "Drill into your data by date, category, location, or staff name. Filters apply across all reports for focused analysis.",
    fullDetails:
      "Every module supports multi-criteria filtering. Filter expenses by category, stock by supplier, payments by vendor, or combine multiple filters to analyze patterns.",
    images: ["/images/features/filters.png"],
  },
  {
    title: "Staff-Specific Insights",
    icon: <Users className="text-pink-600 w-6 h-6" />,
    description:
      "Assign expenses and stock activity to individual staff. Analyze contribution, spending patterns, and productivity by person.",
    fullDetails:
      "Each staff member has a profile page with activity logs, summaries of their expenses and orders, plus charts showing trends over time.",
    images: ["/images/features/staff-insights.png"],
  },
  {
    title: "Staff Activity Monitor",
    icon: <ActivitySquare className="text-indigo-600 w-6 h-6" />,
    description:
      "Track which staff members added expenses, placed orders, or completed payments. Logs are time-stamped for accountability.",
    fullDetails:
      "View an activity feed of actions across modules with timestamps. Filter logs by user or date. Designed for auditing and transparency.",
    images: ["/images/features/activity-monitor.png"],
  },
  {
    title: "Export to PDF & Excel",
    icon: <Download className="text-gray-600 w-6 h-6" />,
    description:
      "Easily export any report or summary for offline sharing, audits, or bookkeeping.",
    fullDetails:
      "All tables and reports have an export button. Choose columns to include, customize headers, and save as Excel or professionally styled PDF.",
    images: ["/images/features/exporting.png"],
  },
  {
    title: "Dashboard Overview",
    icon: <BarChart2 className="text-teal-600 w-6 h-6" />,
    description:
      "Quickly assess your business health with a clean dashboard showing revenue, expenses, orders, and cash balance.",
    fullDetails:
      "The main dashboard combines data from all modules, showing KPIs and graphs at a glance. Auto-updates daily or on demand.",
    images: ["/images/features/dashboard.png"],
  },
];

export default function GetStarted() {
  const [selectedFeature, setSelectedFeature] = useState(null);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blue-50 to-white px-6 py-12">
      <div className="w-full max-w-6xl bg-white shadow-xl rounded-3xl p-8 sm:p-12 text-center animate-fade-in">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-blue-800 mb-6 drop-shadow-md tracking-tight">
          Welcome to <span className="text-blue-600">Business Control Suite</span>
        </h1>
        <p className="text-gray-700 text-lg sm:text-xl mb-10 leading-relaxed">
          Gain full control of your operations — track expenses, manage stock, monitor payments,
          and review team activities. Let our smart dashboards power your decisions.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left mb-12">
          {features.map((feature, i) => (
            <div key={i} onClick={() => setSelectedFeature(feature)} className="cursor-pointer transition-transform hover:-translate-y-1">
              <FeatureCard {...feature} />
            </div>
          ))}
        </div>

        <Link href="/">
          <span className="inline-block bg-blue-600 text-white font-semibold px-10 py-3 rounded-full hover:bg-blue-700 transition text-base sm:text-lg shadow-md">
            Go to Login
          </span>
        </Link>
      </div>

      {/* Fancy Modal */}
      {selectedFeature && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-lg z-50 flex items-center justify-center px-4 py-10 overflow-y-auto animate-fade-in">
          <div className="bg-white max-w-4xl w-full rounded-2xl p-6 md:p-8 relative shadow-2xl border border-blue-100 animate-slide-up">
            <button onClick={() => setSelectedFeature(null)} className="absolute top-4 right-4 hover:bg-gray-100 p-2 rounded-full">
              <X className="text-gray-600 hover:text-red-500 w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-blue-100 rounded-full shadow-inner">{selectedFeature.icon}</div>
              <h2 className="text-2xl md:text-3xl font-bold text-blue-800">{selectedFeature.title}</h2>
            </div>

            {selectedFeature.images && selectedFeature.images.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {selectedFeature.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`${selectedFeature.title} image ${idx + 1}`}
                    className="w-full h-48 object-cover rounded-lg border border-gray-200 shadow-sm"
                  />
                ))}
              </div>
            )}

            <div className="text-gray-700 text-sm sm:text-base leading-relaxed space-y-4">
              <p>{selectedFeature.fullDetails}</p>
              <ul className="list-disc pl-5 text-gray-600 space-y-1">
                {selectedFeature.title.toLowerCase().includes("expense") && (
                  <>
                    <li>Tag, categorize, and assign expenses to staff or locations.</li>
                    <li>Upload receipts and view expense history by date or user.</li>
                    <li>Auto-calculated totals with category summaries and staff-wise filtering.</li>
                  </>
                )}
                {selectedFeature.title.toLowerCase().includes("dashboard") && (
                  <>
                    <li>All-in-one snapshot of business performance.</li>
                    <li>Real-time KPIs, trend graphs, and budget highlights.</li>
                    <li>Customized per department, user, or region.</li>
                  </>
                )}
                {selectedFeature.title.toLowerCase().includes("export") && (
                  <>
                    <li>Export to clean PDF or Excel formats.</li>
                    <li>Custom branding, filter settings, and data range control.</li>
                    <li>Perfect for stakeholder reports, audits, and compliance.</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Reusable Feature Card
function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow hover:shadow-md transition duration-200">
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}
