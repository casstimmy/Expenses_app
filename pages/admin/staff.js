import React, { useState, useEffect, useRef } from "react";
import Layout from "@/components/Layout";
import Link from "next/link";
import SalaryTable from "@/components/SalaryTable";

const LOCATIONS = ["Ibile 1", "Ibile 2"];

function toCamelCase(str) {
  return str
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

export default function ManageStaff() {
  const [staffList, setStaffList] = useState([]);
  const [loadingStaffList, setLoadingStaffList] = useState(true);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState("list");
  const [editedSalary, setEditedSalary] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const salaryMemoRef = useRef();

  const [currentStaff, setCurrentStaff] = useState(null);

  const [form, setForm] = useState({
    name: "",
    password: "",
    location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
    role: "staff",
    bank: {
      accountName: "",
      accountNumber: "",
      bankName: "",
    },
    staffId: "",
    reason: "",
    amount: "",
    salary: "",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    password: "",
    location: "",
    role: "staff",
    bank: {
      accountName: "",
      accountNumber: "",
      bankName: "",
    },
  });

  useEffect(() => {
    const stored = localStorage.getItem("staff");
    if (stored) {
      setCurrentStaff(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    if (staffList && staffList.length > 0) {
      setEditedSalary(
        staffList.map((staff) => ({
          ...staff,
          salary: staff.salary || 0,
        }))
      );
    }
  }, [staffList]);

  const fetchStaff = async () => {
    setLoadingStaffList(true);

    try {
      // Step 1: Fetch the staff list
      const res = await fetch("/api/staff/all");
      const data = await res.json();

      if (res.ok) {
        setStaffList(data);
      } else {
        throw new Error("Failed to fetch staff list.");
      }
    } catch (error) {
      console.error("Failed to fetch staff:", error);
      setStaffList([]);
      alert("Failed to load staff list.");
      setLoadingStaffList(false);
      setIsSending(false);
      return;
    }

    setLoadingStaffList(false);
  };

  const handleSendingMail = async () => {
    setIsSending(true);
    try {
      // Step 2: Send the salary mail using Authorization header (secure, not in URL)
    const mailRes = await fetch("/api/staff/salary-mail/cron?force=true", {
  method: "POST",
  headers: {
    Authorization: "Bearer 009CJuqL8lhX/j0M9sd6s/NHeA1bTwHMoAmUxB83X5k=",
  },
});


      const mailData = await mailRes.json();

      if (mailRes.ok) {
        alert("Mail sent successfully!");
      } else {
        console.error("Mail error:", mailData);
        alert("Failed to send mail.");
      }
    } catch (error) {
      console.error("Error sending mail:", error);
      alert("An error occurred while sending the mail.");
    }

    setIsSending(false);
  };
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (["accountName", "accountNumber", "bankName"].includes(name)) {
      setForm((prev) => ({
        ...prev,
        bank: {
          ...prev.bank,
          [name]: value,
        },
      }));
    } else if (name === "name") {
      setForm((prev) => ({ ...prev, name: toCamelCase(value) }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    if (["accountName", "accountNumber", "bankName"].includes(name)) {
      setEditForm((prev) => ({
        ...prev,
        bank: {
          ...prev.bank,
          [name]: value,
        },
      }));
    } else if (name === "name") {
      setEditForm((prev) => ({ ...prev, name: toCamelCase(value) }));
    } else {
      setEditForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const res = await fetch("/api/staff/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (res.ok) {
      setMessage("Staff added successfully.");
      setForm({
        name: "",
        password: "",
        location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
        role: "staff",
        bank: {
          accountName: "",
          accountNumber: "",
          bankName: "",
        },
        staffId: "",
        reason: "",
        amount: "",
      });
      fetchStaff();
    } else {
      setMessage(data.message || "Error adding staff.");
    }
  };

  const handlePenaltySubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const { staffId, reason, amount, date } = form;

    if (!staffId || !reason || !amount) {
      setMessage("All penalty fields are required.");
      return;
    }

    try {
      const res = await fetch("/api/staff/penalties/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId,
          amount,
          reason: reason.trim() || "Unspecified",
          date: date || new Date().toISOString(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Penalty submitted.");
        setForm((prev) => ({
          ...prev,
          staffId: "",
          reason: "",
          amount: "",
          date: "",
        }));
        await fetchStaff(); // Refresh the list with updated penalties
        setActiveTab("list"); // Switch back to Penalty List tab
      } else {
        setMessage(data.message || "Error submitting penalty.");
      }
    } catch (error) {
      console.error("Penalty submission error:", error);
      setMessage("Error submitting penalty.");
    }
  };

  const startEdit = (staff) => {
    setEditingId(staff._id);
    setEditForm({
      name: staff.name || "",
      password: "",
      location: staff.location || "",
      role: staff.role || "staff",
      bank: {
        accountName: staff.bank?.accountName || "",
        accountNumber: staff.bank?.accountNumber || "",
        bankName: staff.bank?.bankName || "",
      },
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({
      name: "",
      password: "",
      location: "",
      role: "staff",
      bank: {
        accountName: "",
        accountNumber: "",
        bankName: "",
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

    if (res.ok) {
      setMessage("Staff updated.");
      setEditingId(null);
      fetchStaff();
    } else {
      setMessage(data.message || "Error updating staff.");
    }
  };

  const deleteStaff = async (id) => {
    const confirmDelete = confirm(
      "Are you sure you want to delete this staff?"
    );
    if (!confirmDelete) return;

    setMessage("");

    const res = await fetch(`/api/staff/${id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (res.ok) {
      setMessage("Staff deleted.");
      if (editingId === id) cancelEdit();
      fetchStaff();
    } else {
      setMessage(data.message || "Error deleting staff.");
    }
  };

  const handleMemoView = () => {
    localStorage.setItem("staffPayroll", JSON.stringify(staffList));
    router.push("/memo/salary");
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-blue-800 mb-6">
          Manage Staff Logins
        </h1>
        {/* Add New Staff Form */}
        <div>
          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 shadow rounded h-fit"
          >
            <h2 className="text-lg font-semibold mb-3 text-blue-700">
              Add New Staff
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
              <input
                type="text"
                name="name"
                placeholder="Staff Name"
                value={form.name}
                onChange={handleChange}
                className="border p-2 rounded w-full"
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                maxLength={4}
                inputMode="numeric"
                pattern="\d{4}"
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^\d{0,4}$/.test(val)) {
                    handleChange(e);
                  }
                }}
                className="border p-2 rounded w-full"
                required
              />
              <select
                name="location"
                value={form.location}
                onChange={handleChange}
                className="border p-2 rounded w-full"
                required
              >
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              >
                <option value="staff">Staff</option>
                <option value="Senior staff">Manager</option>
                <option value="admin">Admin</option>
                <option value="junior staff">Junior Staff</option>
              </select>
              <input
                type="text"
                name="accountName"
                placeholder="Account Name"
                value={form.bank.accountName}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              />
              <input
                type="text"
                name="accountNumber"
                placeholder="Account Number"
                value={form.bank.accountNumber}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              />
              <input
                type="text"
                name="bankName"
                placeholder="Bank Name"
                value={form.bank.bankName}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              />
              <input
                type="number"
                name="salary"
                placeholder="Salary Amount"
                value={form.salary}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              />
            </div>

            {message && <p className="text-sm text-blue-700 mb-3">{message}</p>}

            <button
              type="submit"
              className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 w-full"
            >
              Add Staff
            </button>
          </form>
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-start gap-6 h-120 mt-6">
          {/* All Staff List */}
          <div className="bg-white p-6 shadow rounded-lg w-full lg:w-2/3 overflow-y-auto h-full">
            <h2 className="text-xl font-semibold mb-6 text-blue-700">
              All Staff
            </h2>

            {loadingStaffList ? (
              <div className="flex justify-center items-center py-10">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-3 text-sm text-gray-500">
                  Loading staff list...
                </span>
              </div>
            ) : staffList.length === 0 ? (
              <p className="text-gray-500">No staff created yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {staffList.map((staff) => (
                  <div
                    key={staff._id}
                    className="p-4 rounded-lg shadow-sm hover:shadow-md transition duration-300 border border-gray-200 bg-white"
                  >
                    {editingId === staff._id ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          name="name"
                          value={editForm.name}
                          onChange={handleEditChange}
                          className="border p-2 rounded w-full"
                        />
                        <select
                          name="location"
                          value={editForm.location}
                          onChange={handleEditChange}
                          className="border p-2 rounded w-full"
                        >
                          {LOCATIONS.map((loc) => (
                            <option key={loc} value={loc}>
                              {loc}
                            </option>
                          ))}
                        </select>
                        <select
                          name="role"
                          value={editForm.role}
                          onChange={handleEditChange}
                          className="border p-2 rounded w-full"
                        >
                          <option value="staff">Staff</option>
                          <option value="Senior staff">Manager</option>
                          <option value="admin">Admin</option>
                          <option value="junior staff">Junior Staff</option>
                        </select>
                        <input
                          type="password"
                          name="password"
                          placeholder="Leave blank to keep current password"
                          value={editForm.password}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (/^\d{0,4}$/.test(val)) handleEditChange(e);
                          }}
                          className="border p-2 rounded w-full"
                          maxLength={4}
                          inputMode="numeric"
                          pattern="\d{4}"
                        />
                        <input
                          type="text"
                          name="accountName"
                          placeholder="Account Name"
                          value={editForm.bank.accountName}
                          onChange={handleEditChange}
                          className="border p-2 rounded w-full"
                        />
                        <input
                          type="text"
                          name="accountNumber"
                          placeholder="Account Number"
                          value={editForm.bank.accountNumber}
                          onChange={handleEditChange}
                          className="border p-2 rounded w-full"
                        />
                        <input
                          type="text"
                          name="bankName"
                          placeholder="Bank Name"
                          value={editForm.bank.bankName}
                          onChange={handleEditChange}
                          className="border p-2 rounded w-full"
                        />

                        <input
                          type="text"
                          name="salary"
                          placeholder="Salary Amount"
                          value={editForm.salary}
                          onChange={handleEditChange}
                          className="border p-2 rounded w-full"
                        />
                        <div className="text-xs text-gray-500">
                          Leave blank to keep existing password.
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            onClick={() => saveEdit(staff._id)}
                            className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 text-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="bg-gray-400 text-white px-4 py-1 rounded hover:bg-gray-500 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-4 w-full">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
                          {staff.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="text-lg font-semibold text-gray-800">
                            {staff.name}
                          </div>
                          <div className="text-sm text-gray-600 mb-1">
                            📍 {staff.location}
                          </div>
                          <span
                            className={`text-xs font-medium px-2 py-1 rounded-full inline-block
                    ${
                      staff.role === "admin" || staff.role === "Senior staff"
                        ? "bg-red-100 text-red-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                          >
                            {staff.role}
                          </span>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => startEdit(staff)}
                            className="text-xs px-2 py-1 border border-blue-500 text-blue-600 rounded-full hover:bg-blue-500 hover:text-white transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteStaff(staff._id)}
                            className="text-xs px-2 py-1 border border-red-500 text-red-600 rounded-full hover:bg-red-500 hover:text-white transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <p className="text-sm text-gray-500 mt-6">
              Note: Passwords are hashed and not displayed for security.
            </p>
          </div>

          {/* Penalty Entry */}
          <div className="bg-white p-6 shadow rounded-lg w-full lg:w-1/3 overflow-y-auto h-full">
            <h2 className="text-xl font-semibold mb-4 text-blue-700">
              Staff Penalty
            </h2>

            {/* Tab Pills */}
            <div className="flex space-x-4 mb-4">
              <button
                className={`px-4 py-2 rounded-full ${
                  activeTab === "list"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200"
                }`}
                onClick={() => setActiveTab("list")}
              >
                Penalty List
              </button>

              <button
                className={`px-4 py-2 rounded-full ${
                  activeTab === "form"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200"
                }`}
                onClick={() => setActiveTab("form")}
              >
                Add Penalty
              </button>
            </div>

            {/* Penalty List */}
            {activeTab === "list" && (
              <div className="space-y-4">
                {staffList
                  .filter((s) => s.penalty && s.penalty.length)
                  .map((staff) => (
                    <div
                      key={staff._id}
                      className="bg-white border border-gray-200 p-5 rounded-lg shadow hover:shadow-md transition"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold text-blue-800">
                          {staff.name}
                          <span className="text-sm text-gray-500 ml-2">
                            ({staff.role})
                          </span>
                        </h3>
                        <span className="text-sm bg-red-100 text-red-600 px-2 py-1 rounded-full">
                          {staff.penalty.length} Penalt
                          {staff.penalty.length > 1 ? "ies" : "y"}
                        </span>
                      </div>
                      <ul className="space-y-2 pl-4 border-l-2 border-blue-100">
                        {staff.penalty.map((p, i) => (
                          <li key={i} className="text-sm text-gray-800">
                            <span className="font-medium text-red-700">
                              ₦{p.amount}
                            </span>{" "}
                            – <span className="italic">{p.reason}</span>{" "}
                            <span className="text-gray-500">
                              ({new Date(p.date).toLocaleDateString()})
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </div>
            )}

            {/* Add Penalty Form */}
            {activeTab === "form" && (
              <form
                onSubmit={handlePenaltySubmit}
                className="grid grid-cols-1 gap-4 mt-2"
              >
                <select
                  name="staffId"
                  value={form.staffId}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                  required
                >
                  <option value="">Select Staff</option>
                  {staffList.map((staff) => (
                    <option key={staff._id} value={staff._id}>
                      {staff.name} ({staff.role})
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  name="amount"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Penalty Amount"
                  value={form.amount}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                  required
                />

                <input
                  type="text"
                  name="reason"
                  inputMode="text"
                  placeholder="Reason"
                  value={form.reason}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />

                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />

                <button
                  type="submit"
                  className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                  Submit
                </button>
              </form>
            )}
            {message && (
              <p className="text-sm text-blue-700 mb-3 mt-3">{message}</p>
            )}
          </div>
        </div>

        {/* Salary Table Entry */}
        <div className="bg-white mt-8 p-6 shadow rounded-lg w-full overflow-y-auto h-full">
          <h2 className="text-xl font-semibold mb-6 text-blue-700">
            Salary Table
          </h2>

          <SalaryTable
            currentStaff={currentStaff}
            staffList={staffList}
            onDownloading={setDownloading}
            ref={salaryMemoRef}
          />

          {currentStaff?.role === "admin" && (
            <div className="flex justify-end mt-6 gap-3">
              <button
                onClick={handleSendingMail}
                disabled={isSending}
                className={`mt-4 ${
                  isSending ? "bg-gray-400" : "bg-gray-500 hover:bg-gray-700"
                } text-white px-4 py-2 rounded transition-colors duration-200 cursor-pointer`}
              >
                {isSending ? "Sending Mail..." : "Send Salary Mail"}
              </button>

              <button
                onClick={() => window.print()}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors duration-200 cursor-pointer"
              >
                Print Salary Table
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
