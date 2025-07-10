import Link from "next/link";
import { BarChart2, PieChart, Download, Sliders, Users } from "lucide-react";

export default function GetStarted() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blue-50 to-white px-6 py-12">
      <div className="w-full max-w-4xl bg-white shadow-2xl rounded-2xl p-8 sm:p-12 text-center animate-fade-in">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-blue-800 mb-6 drop-shadow">
          Welcome to <span className="text-blue-600">Expense Analysis</span>
        </h1>

        <p className="text-gray-700 text-base sm:text-lg mb-8 leading-relaxed">
          Easily monitor, analyze, and manage all your business expenditures in one place. Our app
          empowers you with clear financial insights using interactive charts and downloadable reports
          – all with a clean and easy-to-use interface.
        </p>

        {/* Features Section */}
        <div className="grid sm:grid-cols-2 gap-6 text-left mb-10">
          <FeatureCard
            icon={<PieChart className="text-blue-600 w-6 h-6" />}
            title="Visual Reports"
            description="Generate real-time pie and bar charts to understand spending patterns across locations, categories, and time periods."
          />
          <FeatureCard
            icon={<Sliders className="text-green-600 w-6 h-6" />}
            title="Smart Filters"
            description="Apply dynamic filters to drill down into specific expense data — by date, type, staff, or location."
          />
          <FeatureCard
            icon={<Download className="text-purple-600 w-6 h-6" />}
            title="PDF & Excel Reports"
            description="Export detailed summaries in PDF or Excel format to share with management or keep for bookkeeping."
          />
          <FeatureCard
            icon={<Users className="text-pink-600 w-6 h-6" />}
            title="Staff-Specific Tracking"
            description="Track expenses made by individual staff members, helping ensure accountability and transparency."
          />
        </div>

        {/* Call to Action */}
        <Link href="/">
          <span className="inline-block bg-blue-600 text-white font-semibold px-10 py-3 rounded-full hover:bg-blue-700 transition text-base sm:text-lg shadow-lg">
            Go to Login
          </span>
        </Link>
      </div>
    </div>
  );
}

// Reusable FeatureCard component
function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-gray-50 rounded-xl p-5 shadow-sm hover:shadow-md transition">
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}
