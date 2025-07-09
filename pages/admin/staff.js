import { useState, useEffect } from "react";
import Layout from "@/components/Layout";

const LOCATIONS = ["Ibile 1", "Ibile 2"];


// Helper to convert string to Camel Case (each word capitalized)
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
  const [form, setForm] = useState({
    name: "",
    password: "",
    location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
    role: "staff",
  });

  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    password: "",
    location: "",
    role: "staff",
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setLoadingStaffList(true);
    try {
      const res = await fetch("/api/staff/all");
      const data = await res.json();
      setStaffList(data);
    } catch (error) {
      console.error("Failed to fetch staff", error);
      setStaffList([]);
    }
    setLoadingStaffList(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "name") {
      setForm((prev) => ({ ...prev, name: toCamelCase(value) }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    if (name === "name") {
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
      setForm({ name: "", password: "", location: "", role: "staff" });
      fetchStaff();
    } else {
      setMessage(data.message || "Error adding staff.");
    }
  };

  const startEdit = (staff) => {
    setEditingId(staff._id);
    setEditForm({
      name: staff.name,
      password: "",
      location: staff.location,
      role: staff.role || "staff",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: "", password: "", location: "", role: "staff" });
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

  // New delete function
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

  return (
    <Layout>
      <div className="max-w-4xl mx-auto bg-gray-100 py-10 px-4">
        <h1 className="text-3xl font-bold text-blue-800 mb-6">
          Manage Staff Logins
        </h1>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 shadow rounded mb-6"
        >
          <h2 className="text-lg font-semibold mb-3">Add New Staff</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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
              <option value="admin">Admin</option>
              <option value="Senior staff">Manager</option>
            </select>
          </div>

          {message && <p className="text-sm text-blue-700 mb-3">{message}</p>}

          <button
            type="submit"
            className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700"
          >
            Add Staff
          </button>
        </form>

        <div className="bg-white p-6 shadow rounded">
          <h2 className="text-lg font-semibold mb-6">All Staff</h2>
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
            <div className="grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {staffList.map((staff) => (
                <div
                  key={staff._id}
                  className="p-4 rounded-xl shadow hover:shadow-lg transition duration-300 border border-gray-100 bg-gradient-to-br from-white to-gray-50"
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
                        value={editForm.role}
                        onChange={handleEditChange}
                        className="border p-2 rounded w-full"
                      >
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                        <option value="Senior staff">Manager</option>
                      </select>
                      <input
                        type="password"
                        name="password"
                        placeholder="Leave blank to keep current password"
                        value={editForm.password}
                        onChange={(e) => {
                          // Only allow up to 4 digits numeric input
                          const val = e.target.value;
                          if (/^\d{0,4}$/.test(val)) {
                            handleEditChange(e);
                          }
                        }}
                        className="border p-2 rounded w-full"
                        maxLength={4}
                        inputMode="numeric"
                        pattern="\d{4}"
                      />

                      <div className="text-xs text-gray-500">
                        Leave blank to keep existing password.
                      </div>
                      <div className="flex gap-2 justify-end pt-2">
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
                      <div className="flex justify-between items-start gap-18">
                        {/* Left Container: Avatar + Staff Info */}
                        <div className="flex gap-4 flex-1">
                          {/* Avatar */}
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
                            {staff.name?.charAt(0).toUpperCase()}
                          </div>

                          {/* Staff Info */}
                          <div className="flex flex-col justify-between">
                            <div>
                              <div className="text-lg font-semibold text-gray-800">
                                {staff.name}
                              </div>
                              <div className="text-sm text-gray-600">
                                📍 {staff.location}
                              </div>
                            </div>

                            <div
                              className={`mt-2 inline-block text-xs px-2 py-1 rounded-full font-semibold w-fit ${
                                staff.role === "admin" ||
                                staff.role === "Senior staff"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {staff.role}
                            </div>
                          </div>
                        </div>

                        {/* Right Container: Action Buttons */}
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => startEdit(staff)}
                            className="text-xs px-2 py-1 border border-blue-500 text-blue-600 rounded-full hover:bg-blue-500 hover:text-white transition-all duration-200 shadow-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteStaff(staff._id)}
                            className="text-xs px-2 py-1 border border-red-500 text-red-600 rounded-full hover:bg-red-500 hover:text-white transition-all duration-200 shadow-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
