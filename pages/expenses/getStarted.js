import Link from "next/link";

export default function GetStarted() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 p-6">
      <div className="max-w-3xl bg-white p-10 rounded-xl shadow-lg text-center">
        <h1 className="text-4xl font-bold text-blue-800 mb-6">Welcome to Expense Analysis</h1>
        <p className="text-lg text-gray-700 mb-6">
          This app helps you visualize and monitor your business expenditures easily in one place. 
          You can track your expenses by category, location, and date; apply filters to analyze 
          spending trends; and download detailed reports to share or keep for your records.
        </p>
        <p className="text-lg text-gray-700 mb-8">
          Use interactive pie charts and bar charts to understand where your money goes. 
          Filter expenses to gain insights and make informed financial decisions for your business.
        </p>

        <Link href="/login">
          <a className="inline-block bg-blue-600 text-white font-semibold px-8 py-3 rounded-lg hover:bg-blue-700 transition">
            Go to Login
          </a>
        </Link>
      </div>
    </div>
  );
}
