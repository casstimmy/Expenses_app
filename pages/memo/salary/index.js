import { useEffect, useState, useRef } from "react";
import SalaryMemo from "@/components/SalaryMemo";

const accountOptions = [
  { value: "1239069143", label: "1239069143 - IBILE TRADING RESOURCES LIMITED" },
  { value: "1400837182", label: "1400837182 - IBILE SAVINGS ACCOUNT" },
];

const directorOptions = ["Catherine Ashenuga Farrer", "Paul Farrer"];

export default function SalaryMemoPage() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(accountOptions[0].value);
  const [selectedDirector, setSelectedDirector] = useState(directorOptions[0]);
  const [memoIndex, setMemoIndex] = useState(0); // moved this to state
  const memoRef = useRef();

  useEffect(() => {
    // Safe access to localStorage
    const storedList = localStorage.getItem("staffPayroll");
    const storedIndex = localStorage.getItem("payrollChunkIndex");

    if (storedList) {
      try {
        setStaffList(JSON.parse(storedList));
      } catch (err) {
        console.error("Invalid JSON in staffPayroll:", err);
      }
    }

    if (storedIndex) {
      setMemoIndex(Number(storedIndex));
    }

    setLoading(false);
  }, []);

  if (loading) return <div className="p-10 text-center">Loading memo...</div>;
  if (!staffList || staffList.length === 0)
    return <div className="p-10 text-center text-red-600">Memo not found.</div>;

  return (
    <div className="pb-5">
      <div className="mt-5 pb-3 print:hidden">
        <div className="flex flex-wrap items-end justify-center gap-6 max-w-4xl mx-auto">
          {/* Select Account */}
          <div className="flex flex-col w-full sm:w-auto">
            <label className="text-sm font-medium text-gray-700 mb-1">
              Select Account:
            </label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full sm:w-64 px-4 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {accountOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col w-full sm:w-auto">
            <label className="text-sm font-medium text-gray-700 mb-1">
              Select Director:
            </label>
            <select
              value={selectedDirector}
              onChange={(e) => setSelectedDirector(e.target.value)}
              className="w-full sm:w-64 px-4 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {directorOptions.map((directorName) => (
                <option key={directorName} value={directorName}>
                  {directorName}
                </option>
              ))}
            </select>
            <div className="mt-2 flex flex-col gap-1">
              {directorOptions.map((directorName) => (
                <label
                  key={directorName}
                  className="inline-flex items-center gap-2 text-xs font-medium text-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={selectedDirector === directorName}
                    onChange={() => setSelectedDirector(directorName)}
                    className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  {directorName} active
                </label>
              ))}
            </div>
          </div>

          {/* Download Button */}
          <button
            onClick={() => memoRef.current?.generatePDF()}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-md shadow transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={downloading}
          >
            {downloading ? "Downloading..." : "Download PDF"}
          </button>
        </div>
      </div>

      <SalaryMemo
        ref={memoRef}
        staffList={staffList}
        editing={editing}
        onDownloading={setDownloading}
        selectedAccount={selectedAccount}
        selectedDirector={selectedDirector}
        memoIndex={memoIndex}
      />
    </div>
  );
}
