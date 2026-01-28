import React, { useState, useEffect, useRef } from "react";
import Layout from "@/components/Layout";
import { useRouter } from "next/router";
import SalaryTable from "@/components/SalaryTable";

const LOCATIONS = ["Ibile 1", "Ibile 2"];

function toCamelCase(str) {
  return str
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

export default function ManageStaff() {
  const router = useRouter();
  const salaryMemoRef = useRef();

  const [staffList, setStaffList] = useState([]);
  const [loadingStaffList, setLoadingStaffList] = useState(true);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState("list");
  const [isSending, setIsSending] = useState(false);
  const [currentStaff, setCurrentStaff] = useState(null);

  const [form, setForm] = useState({
    name: "",
    password: "",
    location: LOCATIONS[0],
    role: "staff",
    salary: "",
    bank: {
      accountName: "",
      accountNumber: "",
      bankName: "",
    },
    staffId: "",
    reason: "",
    amount: "",
    date: "",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    password: "",
    location: "",
    role: "staff",
    salary: "",
    bank: {
      accountName: "",
      accountNumber: "",
      bankName: "",
    },
  });

  /* ------------------ INIT ------------------ */
  useEffect(() => {
    const stored = localStorage.getItem("staff");
    if (stored) setCurrentStaff(JSON.parse(stored));
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setLoadingStaffList(true);
    try {
      const res = await fetch("/api/staff/all");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setStaffList(data);
    } catch (err) {
      alert("Failed to load staff");
    } finally {
      setLoadingStaffList(false);
    }
  };

  /* ------------------ MAIL ------------------ */
  const handleSendingMail = async () => {
    setIsSending(true);
    try {
      const res = await fetch("/api/staff/salary-mail/cron?force=true", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data);
        alert(data.error || "Mail failed");
        return;
      }

      alert("Salary mail sent successfully ✅");
    } catch (err) {
      console.error(err);
      alert("Mail sending failed");
    } finally {
      setIsSending(false);
    }
  };

  /* ------------------ FORM HANDLERS ------------------ */
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (["accountName", "accountNumber", "bankName"].includes(name)) {
      setForm((p) => ({ ...p, bank: { ...p.bank, [name]: value } }));
    } else if (name === "name") {
      setForm((p) => ({ ...p, name: toCamelCase(value) }));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    if (["accountName", "accountNumber", "bankName"].includes(name)) {
      setEditForm((p) => ({ ...p, bank: { ...p.bank, [name]: value } }));
    } else if (name === "name") {
      setEditForm((p) => ({ ...p, name: toCamelCase(value) }));
    } else {
      setEditForm((p) => ({ ...p, [name]: value }));
    }
  };

  /* ------------------ EDIT ------------------ */
  const startEdit = (staff) => {
    setEditingId(staff._id);
    setEditForm({
      name: staff.name,
      password: "",
      location: staff.location,
      role: staff.role,
      salary: staff.salary || "",
      bank: {
        accountName: staff.bank?.accountName || "",
        accountNumber: staff.bank?.accountNumber || "",
        bankName: staff.bank?.bankName || "",
      },
    });
  };

  const saveEdit = async (id) => {
    const res = await fetch(`/api/staff/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });

    const data = await res.json();
    if (!res.ok) return alert(data.message || "Update failed");

    setEditingId(null);
    fetchStaff();
  };

  /* ------------------ UI ------------------ */
  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6 bg-gray-100">
        <h1 className="text-3xl font-bold text-blue-800 mb-6">
          Manage Staff
        </h1>

        {/* Salary Table */}
        <div className="bg-white p-6 shadow rounded mt-8">
          <SalaryTable
            staffList={staffList}
            currentStaff={currentStaff}
            ref={salaryMemoRef}
          />

          {currentStaff?.role === "admin" && (
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleSendingMail}
                disabled={isSending}
                className={`px-4 py-2 rounded text-white ${
                  isSending
                    ? "bg-gray-400"
                    : "bg-gray-600 hover:bg-gray-800"
                }`}
              >
                {isSending ? "Sending..." : "Send Salary Mail"}
              </button>

              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Print
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
