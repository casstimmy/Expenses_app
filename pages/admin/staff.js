import React, { useState, useEffect, useRef } from "react";
import Layout from "@/components/Layout";
import Link from "next/link";
import { useRouter } from "next/router";
import SalaryTable from "@/components/SalaryTable";
import { Camera, Copy, CheckCircle, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

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
  const staffPhotoRef = useRef(null);
  const router = useRouter();

  const [currentStaff, setCurrentStaff] = useState(null);

  // Photo upload state
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Onboarding / profile viewer
  const [expandedProfile, setExpandedProfile] = useState(null);
  const [copiedLink, setCopiedLink] = useState(null);

  // Penalty edit state
  const [editingPenalty, setEditingPenalty] = useState(null); // { staffId, index }
  const [editPenaltyForm, setEditPenaltyForm] = useState({ amount: "", reason: "", date: "" });
  const [clearingPenalties, setClearingPenalties] = useState(false);

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
    photo: "",
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
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload-image", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        const url = data.links?.[0] || "";
        setPhotoUrl(url);
        setForm((prev) => ({ ...prev, photo: url }));
      }
    } catch (err) {
      console.error("Photo upload failed:", err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const copyOnboardingLink = (staffMember) => {
    const link = `${window.location.origin}/onboarding/${staffMember.onboardingToken}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(staffMember._id);
    setTimeout(() => setCopiedLink(null), 2000);
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
      body: JSON.stringify({ ...form, photo: photoUrl }),
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
        photo: "",
      });
      setPhotoPreview(null);
      setPhotoUrl("");
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

  const handleEditPenalty = (staffId, index, penalty) => {
    setEditingPenalty({ staffId, index });
    setEditPenaltyForm({
      amount: penalty.amount || "",
      reason: penalty.reason || "",
      date: penalty.date ? new Date(penalty.date).toISOString().split("T")[0] : "",
    });
  };

  const handleSavePenaltyEdit = async () => {
    if (!editingPenalty) return;
    try {
      const res = await fetch(
        `/api/staff/penalties/${editingPenalty.staffId}/${editingPenalty.index}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editPenaltyForm),
        }
      );
      if (res.ok) {
        setMessage("Penalty updated.");
        setEditingPenalty(null);
        await fetchStaff();
      } else {
        const data = await res.json();
        setMessage(data.message || "Error updating penalty.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Error updating penalty.");
    }
  };

  const handleDeletePenalty = async (staffId, index) => {
    if (!confirm("Are you sure you want to delete this penalty?")) return;
    try {
      const res = await fetch(`/api/staff/penalties/${staffId}/${index}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMessage("Penalty deleted.");
        await fetchStaff();
      } else {
        const data = await res.json();
        setMessage(data.message || "Error deleting penalty.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Error deleting penalty.");
    }
  };

  const handleClearAllPenalties = async () => {
    if (!confirm("Clear ALL penalties for ALL staff? This usually happens after salary memo is generated.")) return;
    setClearingPenalties(true);
    try {
      const res = await fetch("/api/staff/penalties/clear", { method: "POST" });
      if (res.ok) {
        setMessage("All penalties cleared.");
        await fetchStaff();
      } else {
        const data = await res.json();
        setMessage(data.message || "Error clearing penalties.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Error clearing penalties.");
    } finally {
      setClearingPenalties(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto bg-gray-100 py-4 sm:py-8 px-3 sm:px-6 lg:px-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-blue-800 mb-4 sm:mb-6">
          Manage Staff
        </h1>
        {/* Add New Staff Form */}
        <div>
          <form
            onSubmit={handleSubmit}
            className="bg-white p-4 sm:p-6 shadow rounded h-fit"
          >
            <h2 className="text-base sm:text-lg font-semibold mb-3 text-blue-700">
              Add New Staff
            </h2>

            {/* Staff Photo Upload */}
            <div className="flex items-center gap-4 mb-4">
              <div
                onClick={() => staffPhotoRef.current?.click()}
                className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition overflow-hidden shrink-0"
              >
                {uploadingPhoto ? (
                  <Loader2 size={20} className="text-blue-400 animate-spin" />
                ) : photoPreview ? (
                  <img src={photoPreview} alt="Staff" className="w-full h-full object-cover" />
                ) : (
                  <Camera size={20} className="text-gray-400" />
                )}
              </div>
              <input ref={staffPhotoRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              <p className="text-xs text-gray-400">Upload staff passport photo (optional — can also be filled via onboarding form)</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
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

        <div className="flex flex-col lg:flex-row justify-between items-start gap-4 sm:gap-6 mt-4 sm:mt-6">
          {/* All Staff List */}
          <div className="bg-white p-4 sm:p-6 shadow rounded-lg w-full lg:w-2/3 overflow-y-auto max-h-[340px]">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-blue-700">
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
                      <div className="w-full">
                        <div className="flex items-start gap-4 w-full">
                          {staff.photo ? (
                            <img src={staff.photo} alt={staff.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg shrink-0">
                              {staff.name?.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-lg font-semibold text-gray-800">
                              {staff.name}
                            </div>
                            <div className="text-sm text-gray-600 mb-1">
                              📍 {staff.location}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
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
                              {staff.onboardingComplete ? (
                                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                                  <CheckCircle size={10} /> Onboarded
                                </span>
                              ) : (
                                <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                                  Pending Form
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 shrink-0">
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

                        {/* Onboarding Link + Profile Toggle */}
                        <div className="mt-3 pt-2 border-t border-gray-100 flex flex-wrap items-center gap-2">
                          {staff.onboardingToken && (
                            <button
                              onClick={() => copyOnboardingLink(staff)}
                              className="flex items-center gap-1 text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100 transition"
                            >
                              {copiedLink === staff._id ? <><CheckCircle size={12} /> Copied!</> : <><Copy size={12} /> Copy Onboarding Link</>}
                            </button>
                          )}
                          {staff.onboardingComplete && (
                            <button
                              onClick={() => setExpandedProfile(expandedProfile === staff._id ? null : staff._id)}
                              className="flex items-center gap-1 text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded hover:bg-gray-100 transition"
                            >
                              {expandedProfile === staff._id ? <><ChevronUp size={12} /> Hide Profile</> : <><ChevronDown size={12} /> View Profile</>}
                            </button>
                          )}
                        </div>

                        {/* Expanded Profile Details */}
                        {expandedProfile === staff._id && staff.onboardingComplete && (
                          <div className="mt-3 bg-gray-50 rounded-lg p-3 text-xs space-y-3">
                            {staff.onboardingData && (
                              <div>
                                <h4 className="font-semibold text-blue-700 mb-1">📋 Personal Details</h4>
                                <div className="grid grid-cols-2 gap-1">
                                  {staff.onboardingData.fullName && <p><span className="text-gray-500">Name:</span> {staff.onboardingData.fullName}</p>}
                                  {staff.onboardingData.phone && <p><span className="text-gray-500">Phone:</span> {staff.onboardingData.phone}</p>}
                                  {staff.onboardingData.email && <p><span className="text-gray-500">Email:</span> {staff.onboardingData.email}</p>}
                                  {staff.onboardingData.dateOfBirth && <p><span className="text-gray-500">DOB:</span> {staff.onboardingData.dateOfBirth}</p>}
                                  {staff.onboardingData.stateOfOrigin && <p><span className="text-gray-500">State:</span> {staff.onboardingData.stateOfOrigin}</p>}
                                  {staff.onboardingData.address && <p className="col-span-2"><span className="text-gray-500">Address:</span> {staff.onboardingData.address}</p>}
                                  {staff.onboardingData.nextOfKin && <p><span className="text-gray-500">Next of Kin:</span> {staff.onboardingData.nextOfKin}</p>}
                                  {staff.onboardingData.nextOfKinPhone && <p><span className="text-gray-500">NoK Phone:</span> {staff.onboardingData.nextOfKinPhone}</p>}
                                </div>
                                {staff.onboardingData.photo && (
                                  <img src={staff.onboardingData.photo} alt="Staff passport" className="w-16 h-16 rounded-lg object-cover mt-2 border" />
                                )}
                              </div>
                            )}
                            {staff.guarantor && staff.guarantor.name && (
                              <div>
                                <h4 className="font-semibold text-blue-700 mb-1">🤝 Guarantor</h4>
                                <div className="grid grid-cols-2 gap-1">
                                  <p><span className="text-gray-500">Name:</span> {staff.guarantor.name}</p>
                                  {staff.guarantor.phone && <p><span className="text-gray-500">Phone:</span> {staff.guarantor.phone}</p>}
                                  {staff.guarantor.email && <p><span className="text-gray-500">Email:</span> {staff.guarantor.email}</p>}
                                  {staff.guarantor.relationship && <p><span className="text-gray-500">Relationship:</span> {staff.guarantor.relationship}</p>}
                                  {staff.guarantor.occupation && <p><span className="text-gray-500">Occupation:</span> {staff.guarantor.occupation}</p>}
                                  {staff.guarantor.address && <p className="col-span-2"><span className="text-gray-500">Address:</span> {staff.guarantor.address}</p>}
                                </div>
                                {staff.guarantor.photo && (
                                  <img src={staff.guarantor.photo} alt="Guarantor passport" className="w-16 h-16 rounded-lg object-cover mt-2 border" />
                                )}
                              </div>
                            )}
                          </div>
                        )}
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
          <div className="bg-white p-4 sm:p-6 shadow rounded-lg w-full lg:w-1/3 overflow-y-auto max-h-[600px] lg:h-full">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 text-blue-700">
              Staff Penalty
            </h2>

            {/* Tab Pills */}
            <div className="flex space-x-2 sm:space-x-4 mb-4">
              <button
                className={`px-3 sm:px-4 py-2 rounded-full text-sm ${
                  activeTab === "list"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200"
                }`}
                onClick={() => setActiveTab("list")}
              >
                Penalty List
              </button>

              <button
                className={`px-3 sm:px-4 py-2 rounded-full text-sm ${
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
                      className="bg-white border border-gray-200 p-4 sm:p-5 rounded-lg shadow hover:shadow-md transition"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-base sm:text-lg font-semibold text-blue-800">
                          {staff.name}
                          <span className="text-sm text-gray-500 ml-2">
                            ({staff.role})
                          </span>
                        </h3>
                        <span className="text-xs sm:text-sm bg-red-100 text-red-600 px-2 py-1 rounded-full">
                          {staff.penalty.length} Penalt
                          {staff.penalty.length > 1 ? "ies" : "y"}
                        </span>
                      </div>
                      <ul className="space-y-2 pl-4 border-l-2 border-blue-100">
                        {staff.penalty.map((p, i) => (
                          <li key={i} className="text-sm text-gray-800">
                            {editingPenalty?.staffId === staff._id && editingPenalty?.index === i ? (
                              <div className="flex flex-wrap items-center gap-2 py-1">
                                <input
                                  type="number"
                                  value={editPenaltyForm.amount}
                                  onChange={(e) => setEditPenaltyForm((prev) => ({ ...prev, amount: e.target.value }))}
                                  className="border px-2 py-1 rounded text-sm w-20"
                                  placeholder="Amount"
                                />
                                <input
                                  type="text"
                                  value={editPenaltyForm.reason}
                                  onChange={(e) => setEditPenaltyForm((prev) => ({ ...prev, reason: e.target.value }))}
                                  className="border px-2 py-1 rounded text-sm flex-1 min-w-[100px]"
                                  placeholder="Reason"
                                />
                                <input
                                  type="date"
                                  value={editPenaltyForm.date}
                                  onChange={(e) => setEditPenaltyForm((prev) => ({ ...prev, date: e.target.value }))}
                                  className="border px-2 py-1 rounded text-sm"
                                />
                                <button onClick={handleSavePenaltyEdit} className="bg-green-600 text-white text-xs px-2 py-1 rounded hover:bg-green-700">Save</button>
                                <button onClick={() => setEditingPenalty(null)} className="bg-gray-300 text-gray-700 text-xs px-2 py-1 rounded hover:bg-gray-400">Cancel</button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between gap-2">
                                <span>
                                  <span className="font-medium text-red-700">₦{p.amount}</span>
                                  {" – "}<span className="italic">{p.reason}</span>{" "}
                                  <span className="text-gray-500">({new Date(p.date).toLocaleDateString()})</span>
                                </span>
                                <div className="flex gap-1 shrink-0">
                                  <button
                                    onClick={() => handleEditPenalty(staff._id, i, p)}
                                    className="text-xs text-blue-600 border border-blue-400 px-2 py-0.5 rounded hover:bg-blue-500 hover:text-white transition"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeletePenalty(staff._id, i)}
                                    className="text-xs text-red-600 border border-red-400 px-2 py-0.5 rounded hover:bg-red-500 hover:text-white transition"
                                  >
                                    Del
                                  </button>
                                </div>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}

                {staffList.some((s) => s.penalty && s.penalty.length > 0) && (
                  <button
                    onClick={handleClearAllPenalties}
                    disabled={clearingPenalties}
                    className="w-full mt-4 bg-red-600 text-white text-sm py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                  >
                    {clearingPenalties ? "Clearing..." : "Clear All Penalties (After Memo)"}
                  </button>
                )}

                {!staffList.some((s) => s.penalty && s.penalty.length > 0) && (
                  <p className="text-gray-500 text-sm italic">No penalties recorded.</p>
                )}
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
        <div className="bg-white mt-4 sm:mt-8 p-4 sm:p-6 shadow rounded-lg w-full overflow-x-auto">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-blue-700">
            Salary Table
          </h2>

          <SalaryTable
            currentStaff={currentStaff}
            staffList={staffList}
            onDownloading={setDownloading}
            ref={salaryMemoRef}
          />

          {currentStaff?.role === "admin" && (
            <div className="flex flex-col sm:flex-row justify-end mt-4 sm:mt-6 gap-2 sm:gap-3">
              <button
                onClick={handleSendingMail}
                disabled={isSending}
                className={`${
                  isSending ? "bg-gray-400" : "bg-gray-500 hover:bg-gray-700"
                } text-white px-4 py-2 rounded transition-colors duration-200 cursor-pointer text-sm w-full sm:w-auto`}
              >
                {isSending ? "Sending Mail..." : "Send Salary Mail"}
              </button>

              <button
                onClick={() => window.print()}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors duration-200 cursor-pointer text-sm w-full sm:w-auto"
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
