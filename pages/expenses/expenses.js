import ExpenseForm from "@/components/ExpenseForm";
import Layout from "@/components/Layout";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  CircleDollarSign,
  MapPin,
  CheckCircle,
} from "lucide-react";
import { useRouter } from "next/router";

export default function ManageExpenses() {
  const [staffData, setStaffData] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [cashEntries, setCashEntries] = useState([]);
  const [cashAmount, setCashAmount] = useState("");
  const [loading, setLoading] = useState(true);

  const [cashDate, setCashDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );

  const [savingCash, setSavingCash] = useState(false);
  const [cashSavedMessage, setCashSavedMessage] = useState("");

  const router = useRouter();

  // Load staff info from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("staff");
    if (!stored) {
      router.replace("/login");
      return;
    }
    setStaffData(JSON.parse(stored));
  }, [router]);

  const fetchExpenses = async () => {
    const res = await fetch("/api/expenses");
    if (res.ok) {
      const data = await res.json();
      setExpenses(Array.isArray(data) ? data : []);
    } else {
      console.error("Failed to fetch expenses");
      setExpenses([]);
    }
  };

  const fetchCashEntries = async () => {
    const res = await fetch("/api/daily-cash");
    if (res.ok) {
      const data = await res.json();
      setCashEntries(Array.isArray(data) ? data : []);
    } else {
      console.error("Failed to fetch daily cash");
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem("staff");
    if (!stored) {
      router.replace("/login");
      return;
    }

    const parsedStaff = JSON.parse(stored);
    setStaffData(parsedStaff);

    // Fetch all data after setting staff
    Promise.all([fetchExpenses(), fetchCashEntries()]).finally(() =>
      setLoading(false)
    );
  }, [router]);

  const handleSaveCash = async () => {
    if (!cashAmount || isNaN(cashAmount)) return;

    const exists = cashEntries.some(
      (entry) =>
        new Date(entry.date).toISOString().split("T")[0] === cashDate &&
        entry.location === staffData.location
    );

    if (exists) {
      const confirmOverwrite = confirm(
        "Cash for this date and location has already been entered. Do you want to update it?"
      );
      if (!confirmOverwrite) return;

      const existingEntry = cashEntries.find(
        (entry) =>
          new Date(entry.date).toISOString().split("T")[0] === cashDate &&
          entry.location === staffData.location
      );

      setSavingCash(true);
      const res = await fetch(`/api/daily-cash/${existingEntry._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(cashAmount),
          date: cashDate,
          location: staffData.location,
          staff: {
            _id: staffData._id,
            name: staffData.name,
            role: staffData.role,
            email: staffData.email,
          },
        }),
      });

      if (res.ok) {
        setCashAmount("");
        setCashSavedMessage("Cash updated successfully!");
        fetchCashEntries();
        setTimeout(() => setCashSavedMessage(""), 3000);
      } else {
        alert("Failed to update existing entry");
      }

      setSavingCash(false);
      return;
    }

    setSavingCash(true);
    const res = await fetch("/api/daily-cash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: Number(cashAmount),
        date: cashDate,
        location: staffData.location,
        staff: {
          _id: staffData._id,
          name: staffData.name,
          role: staffData.role,
          email: staffData.email,
        },
      }),
    });

    if (res.ok) {
      setCashAmount("");
      setCashSavedMessage("Cash saved successfully!");
      fetchCashEntries();
      setTimeout(() => setCashSavedMessage(""), 3000);
    } else {
      console.error("Failed to save daily cash");
    }

    setSavingCash(false);
  };

  const handleEditCash = async (id, currentAmount) => {
    const newAmount = prompt("Edit amount:", currentAmount);
    if (!newAmount || isNaN(newAmount)) return;

    const res = await fetch(`/api/daily-cash/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: Number(newAmount),
        location: staffData.location,
      }),
    });

    if (res.ok) {
      fetchCashEntries();
    } else {
      alert("Failed to update entry");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-sm text-gray-600">Loading Data...</p>
          </div>
        </div>
      </Layout>
    );
  }
  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-blue-800 mb-6">
            Expense Management
          </h1>

          <div className="mb-6 px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-900">
            <p className="font-medium">
              Logged in as{" "}
              <span className="text-blue-800 font-bold">{staffData.name}</span>{" "}
              &nbsp;|&nbsp; Location:{" "}
              <span className="text-blue-800 font-bold">
                {staffData.location}
              </span>
            </p>
          </div>

          <div className="bg-white rounded-xl border border-blue-100 shadow p-6 mb-10 animate-fade-in">
            <h2 className="text-lg font-semibold text-blue-700 mb-4">
              Add Cash for the Day
            </h2>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <input
                type="date"
                value={cashDate}
                onChange={(e) => setCashDate(e.target.value)}
                className="px-4 py-2 border rounded-lg w-full sm:w-1/3"
              />
              <input
                type="number"
                placeholder="Enter cash amount"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                className="px-4 py-2 border rounded-lg w-full sm:w-1/3"
              />
              <button
                onClick={handleSaveCash}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold"
                disabled={savingCash}
              >
                {savingCash ? "Saving..." : "Save"}
              </button>
            </div>

            {cashSavedMessage && (
              <div className="flex items-center gap-2 mt-4 text-green-600">
                <CheckCircle className="w-4 h-4" />
                {cashSavedMessage}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-blue-100">
              <h2 className="text-xl font-semibold text-blue-700 mb-4">
                Add New Expense
              </h2>
              <ExpenseForm
                onSaved={fetchExpenses}
                staffId={staffData._id || staffData.staffId || null}
                location={staffData.location}
                categoryApi="/api/expense-category/expense-category"
              />
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg border border-blue-100 h-[800px] flex flex-col">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">
                Recent Expenses
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6 overflow-y-auto pr-1 flex-grow">
                {expenses
                  .filter((exp) =>
                    staffData.role === "admin"
                      ? true
                      : exp.location === staffData.location
                  )
                  .map((exp) => (
                    <div
                      key={exp._id}
                      className="bg-gray-50 p-4 rounded-lg border"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-base font-medium flex items-center gap-2">
                          <CircleDollarSign className="w-5 h-5 text-green-500" />{" "}
                          {exp.title}
                        </h3>
                        <span className="text-green-600 font-semibold">
                          ₦{Number(exp.amount).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 flex flex-col gap-1">
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs uppercase w-fit">
                          {exp?.category?.name || "Uncategorized"}
                        </span>
                        {exp.location && (
                          <span className="flex items-center gap-1 text-xs">
                            <MapPin className="w-3 h-3" /> {exp.location}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 flex items-center gap-2">
                        <CalendarDays className="w-4 h-4" />
                        {new Date(exp.createdAt).toLocaleDateString("en-NG", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                      {exp.description && (
                        <p className="text-sm mt-3">{exp.description}</p>
                      )}
                      <button className="mt-3 text-blue-600 text-sm font-medium">
                        Edit
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-blue-100 h-[800px] flex flex-col">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">
                Daily Cash Entries
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6 overflow-y-auto pr-1 flex-grow">
                {cashEntries
                  .filter((entry) =>
                    staffData.role === "admin"
                      ? true
                      : entry.location === staffData.location
                  )
                  .map((entry) => (
                    <div
                      key={entry._id}
                      className="bg-gray-50 p-4 rounded-lg border"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-base font-medium flex items-center gap-2">
                          <CircleDollarSign className="w-5 h-5 text-green-500" />{" "}
                          Daily Cash
                        </h3>
                        <span className="text-green-600 font-semibold">
                          ₦{Number(entry.amount).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 flex items-center gap-2">
                        <CalendarDays className="w-4 h-4" />
                        {new Date(entry.date).toLocaleDateString("en-NG", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                      {entry.location && (
                        <div className="text-xs text-gray-400 flex items-center gap-2 mt-1">
                          <MapPin className="w-4 h-4" />
                          {entry.location}
                        </div>
                      )}
                      <button
                        onClick={() => handleEditCash(entry._id, entry.amount)}
                        className="mt-3 text-blue-600 text-sm font-medium"
                      >
                        Edit
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
