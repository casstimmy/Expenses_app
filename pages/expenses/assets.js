import React, { useState, useEffect, useRef } from "react";
import Layout from "@/components/Layout";
import { Camera, Plus, Edit2, Trash2, History, X, Search, Filter } from "lucide-react";

const LOCATIONS = ["Ibile 1", "Ibile 2"];
const ASSET_STATUSES = [
  "Active",
  "In Use",
  "Moved to Store 1",
  "Moved to Store 2",
  "Under Repair",
  "Damaged",
  "Disposed",
  "Lost",
];

const STATUS_COLORS = {
  Active: "bg-green-100 text-green-700",
  "In Use": "bg-blue-100 text-blue-700",
  "Moved to Store 1": "bg-purple-100 text-purple-700",
  "Moved to Store 2": "bg-indigo-100 text-indigo-700",
  "Under Repair": "bg-yellow-100 text-yellow-700",
  Damaged: "bg-red-100 text-red-700",
  Disposed: "bg-gray-100 text-gray-600",
  Lost: "bg-orange-100 text-orange-700",
};

function suggestNameFromFile(filename) {
  if (!filename) return "";
  const name = filename.replace(/\.[^/.]+$/, "");
  return name
    .replace(/[-_\.]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export default function AssetManagement() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    location: LOCATIONS[0],
    category: "",
    status: "Active",
  });

  // Filters
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterLocation, setFilterLocation] = useState("");

  // Status update modal
  const [statusModal, setStatusModal] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");

  // History modal
  const [historyModal, setHistoryModal] = useState(null);

  // Edit modal
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const editFileRef = useRef(null);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const res = await fetch("/api/assets");
      if (res.ok) {
        const data = await res.json();
        setAssets(data);
      }
    } catch (err) {
      console.error("Failed to fetch assets:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageCapture = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);

    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);

    // Auto-suggest name from filename
    if (!form.name) {
      setForm((prev) => ({ ...prev, name: suggestNameFromFile(file.name) }));
    }
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload-image", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return data.links?.[0];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      let imageUrl = "";
      if (imageFile) {
        setUploading(true);
        imageUrl = await uploadImage(imageFile);
        setUploading(false);
      }

      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, image: imageUrl }),
      });

      if (res.ok) {
        setMessage("Asset added successfully!");
        setForm({ name: "", description: "", location: LOCATIONS[0], category: "", status: "Active" });
        setImageFile(null);
        setImagePreview(null);
        setShowForm(false);
        fetchAssets();
      } else {
        const data = await res.json();
        setMessage(data.message || "Failed to add asset.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Error adding asset.");
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const handleStatusUpdate = async (assetId) => {
    if (!newStatus) return;

    try {
      const res = await fetch(`/api/assets/${assetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, statusNote }),
      });

      if (res.ok) {
        setStatusModal(null);
        setNewStatus("");
        setStatusNote("");
        fetchAssets();
      }
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this asset?")) return;

    try {
      const res = await fetch(`/api/assets/${id}`, { method: "DELETE" });
      if (res.ok) fetchAssets();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const openEdit = (asset) => {
    setEditModal(asset._id);
    setEditForm({
      name: asset.name,
      description: asset.description || "",
      location: asset.location || "",
      category: asset.category || "",
    });
    setEditImagePreview(asset.image || null);
    setEditImageFile(null);
  };

  const handleEditImageCapture = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setEditImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleEditSubmit = async (assetId) => {
    try {
      let imageUrl;
      if (editImageFile) {
        imageUrl = await uploadImage(editImageFile);
      }

      const body = { ...editForm };
      if (imageUrl) body.image = imageUrl;

      const res = await fetch(`/api/assets/${assetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setEditModal(null);
        fetchAssets();
      }
    } catch (err) {
      console.error("Edit error:", err);
    }
  };

  // Filtered assets
  const filteredAssets = assets.filter((a) => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus && a.status !== filterStatus) return false;
    if (filterLocation && a.location !== filterLocation) return false;
    return true;
  });

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-4 sm:py-8 px-2 sm:px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-800">Asset Management</h1>
            <p className="text-sm text-gray-500 mt-1">Track and manage all business assets</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
          >
            {showForm ? <X size={18} /> : <Plus size={18} />}
            {showForm ? "Close" : "Add Asset"}
          </button>
        </div>

        {message && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-lg mb-4 text-sm">
            {message}
          </div>
        )}

        {/* Add Asset Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-blue-700 mb-4">New Asset</h2>

            {/* Image Capture */}
            <div className="mb-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full max-w-xs mx-auto border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-40 h-40 object-cover rounded-lg" />
                ) : (
                  <>
                    <Camera size={40} className="text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Tap to take photo or upload image</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageCapture}
                className="hidden"
              />
              {imagePreview && (
                <div className="text-center mt-2">
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Remove photo
                  </button>
                </div>
              )}
              {form.name && imageFile && (
                <p className="text-xs text-gray-400 text-center mt-1">
                  Name auto-suggested from image. Edit as needed.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Asset Name *"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="border p-2 rounded-lg w-full"
                required
              />
              <input
                type="text"
                placeholder="Category (e.g. Furniture, Electronics)"
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className="border p-2 rounded-lg w-full"
              />
              <select
                value={form.location}
                onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                className="border p-2 rounded-lg w-full"
              >
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
              <select
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                className="border p-2 rounded-lg w-full"
              >
                {ASSET_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <textarea
                placeholder="Description / Notes"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className="border p-2 rounded-lg w-full sm:col-span-2"
                rows={2}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-4 bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition w-full sm:w-auto"
            >
              {uploading ? "Uploading image..." : submitting ? "Saving..." : "Save Asset"}
            </button>
          </form>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search assets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border p-2 pl-9 rounded-lg w-full text-sm"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border p-2 rounded-lg text-sm"
          >
            <option value="">All Statuses</option>
            {ASSET_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="border p-2 rounded-lg text-sm"
          >
            <option value="">All Locations</option>
            {LOCATIONS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white p-3 rounded-lg shadow-sm border">
            <p className="text-xs text-gray-500">Total Assets</p>
            <p className="text-xl font-bold text-blue-700">{assets.length}</p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm border">
            <p className="text-xs text-gray-500">Active</p>
            <p className="text-xl font-bold text-green-600">
              {assets.filter((a) => a.status === "Active" || a.status === "In Use").length}
            </p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm border">
            <p className="text-xs text-gray-500">Needs Attention</p>
            <p className="text-xl font-bold text-yellow-600">
              {assets.filter((a) => a.status === "Under Repair" || a.status === "Damaged").length}
            </p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm border">
            <p className="text-xs text-gray-500">Disposed / Lost</p>
            <p className="text-xl font-bold text-red-600">
              {assets.filter((a) => a.status === "Disposed" || a.status === "Lost").length}
            </p>
          </div>
        </div>

        {/* Asset Grid */}
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-lg">No assets found</p>
            <p className="text-sm mt-1">Add your first asset using the button above</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssets.map((asset) => (
              <div key={asset._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
                {/* Image */}
                <div className="h-44 bg-gray-100 flex items-center justify-center overflow-hidden">
                  {asset.image ? (
                    <img src={asset.image} alt={asset.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-gray-300 text-4xl">📦</div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-800 text-base">{asset.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${STATUS_COLORS[asset.status] || "bg-gray-100 text-gray-600"}`}>
                      {asset.status}
                    </span>
                  </div>

                  {asset.category && (
                    <p className="text-xs text-gray-500 mb-1">🏷️ {asset.category}</p>
                  )}
                  {asset.location && (
                    <p className="text-xs text-gray-500 mb-1">📍 {asset.location}</p>
                  )}
                  {asset.description && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{asset.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Added by {asset.addedBy || "Unknown"} · {new Date(asset.createdAt).toLocaleDateString()}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => { setStatusModal(asset._id); setNewStatus(asset.status); setStatusNote(""); }}
                      className="flex-1 flex items-center justify-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-1.5 rounded-lg hover:bg-blue-100 transition"
                    >
                      <Filter size={12} /> Update Status
                    </button>
                    <button
                      onClick={() => setHistoryModal(asset)}
                      className="flex items-center justify-center gap-1 text-xs bg-gray-50 text-gray-600 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition"
                    >
                      <History size={12} />
                    </button>
                    <button
                      onClick={() => openEdit(asset)}
                      className="flex items-center justify-center gap-1 text-xs bg-gray-50 text-gray-600 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={() => handleDelete(asset._id)}
                      className="flex items-center justify-center gap-1 text-xs bg-red-50 text-red-500 px-2 py-1.5 rounded-lg hover:bg-red-100 transition"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Status Update Modal */}
        {statusModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setStatusModal(null)}>
            <div className="bg-white rounded-xl p-5 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Update Asset Status</h3>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="border p-2 rounded-lg w-full mb-3"
              >
                {ASSET_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Add a note (optional)"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                className="border p-2 rounded-lg w-full mb-4"
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setStatusModal(null)} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
                  Cancel
                </button>
                <button
                  onClick={() => handleStatusUpdate(statusModal)}
                  className="px-4 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}

        {/* History Modal */}
        {historyModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setHistoryModal(null)}>
            <div className="bg-white rounded-xl p-5 w-full max-w-md shadow-xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Status History — {historyModal.name}</h3>
                <button onClick={() => setHistoryModal(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
              {historyModal.statusHistory?.length > 0 ? (
                <div className="space-y-3">
                  {[...historyModal.statusHistory].reverse().map((h, i) => (
                    <div key={i} className="flex items-start gap-3 border-l-2 border-blue-200 pl-3">
                      <div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[h.status] || "bg-gray-100 text-gray-600"}`}>
                          {h.status}
                        </span>
                        {h.note && <p className="text-xs text-gray-500 mt-1">{h.note}</p>}
                        <p className="text-xs text-gray-400 mt-0.5">{new Date(h.date).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No history yet.</p>
              )}
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setEditModal(null)}>
            <div className="bg-white rounded-xl p-5 w-full max-w-lg shadow-xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Edit Asset</h3>
                <button onClick={() => setEditModal(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>

              {/* Edit Image */}
              <div className="mb-4">
                <div
                  onClick={() => editFileRef.current?.click()}
                  className="w-32 h-32 mx-auto border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center cursor-pointer hover:border-blue-400 transition overflow-hidden"
                >
                  {editImagePreview ? (
                    <img src={editImagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera size={30} className="text-gray-400" />
                  )}
                </div>
                <input ref={editFileRef} type="file" accept="image/*" capture="environment" onChange={handleEditImageCapture} className="hidden" />
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Asset Name"
                  className="border p-2 rounded-lg w-full"
                />
                <input
                  type="text"
                  value={editForm.category}
                  onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value }))}
                  placeholder="Category"
                  className="border p-2 rounded-lg w-full"
                />
                <select
                  value={editForm.location}
                  onChange={(e) => setEditForm((p) => ({ ...p, location: e.target.value }))}
                  className="border p-2 rounded-lg w-full"
                >
                  {LOCATIONS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Description"
                  className="border p-2 rounded-lg w-full"
                  rows={2}
                />
              </div>

              <div className="flex gap-2 justify-end mt-4">
                <button onClick={() => setEditModal(null)} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">Cancel</button>
                <button onClick={() => handleEditSubmit(editModal)} className="px-4 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700">Save</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
