import { useEffect, useState, useRef } from "react";

import SalaryMemo from "@/components/SalaryMemo";

export default function SalaryMemoPage() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const memoRef = useRef(); // ✅ This is passed to the SalaryMemo component

  useEffect(() => {
    const storedList = localStorage.getItem("staffPayroll");
    if (storedList) {
      try {
        setStaffList(JSON.parse(storedList));
      } catch (err) {
        console.error("Invalid JSON in staffPayroll:", err);
      }
    }
    setLoading(false); // ✅ End loading after processing
  }, []);

  if (loading) return <div className="p-10 text-center">Loading memo...</div>;
  if (!staffList || staffList.length === 0)
    return <div className="p-10 text-center text-red-600">Memo not found.</div>;

  return (
<>
      <SalaryMemo
        ref={memoRef}
        staffList={staffList}
        editing={editing}
        onDownloading={setDownloading}
      />

      <div className="mt-8 pb-10 px-4 print:hidden flex flex-wrap sm:justify-end gap-4">
        <button
          onClick={() => memoRef.current?.generatePDF()}
          className="bg-blue-500 text-white px-4 py-2 rounded w-full hover:bg-blue-600 sm:w-auto cursor-pointer"
          disabled={downloading}
        >
          {downloading ? "Downloading..." : "Download PDF"}
        </button>
      </div>
</>
  );
}
