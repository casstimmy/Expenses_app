import { useEffect, useState } from "react";
import { PETTY_CASH_VENDOR_TYPE } from "@/lib/petty-cash";

const EMPTY_FORM = {
  companyName: "",
  vendorRep: "",
  repPhone: "",
  email: "",
  address: "",
  mainProduct: "",
  businessCategory: "",
  serviceDescription: "",
  paymentTerms: "",
  bankName: "",
  accountName: "",
  accountNumber: "",
};

export default function PettyCashVendorForm({
  editingVendor = null,
  onSuccess,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);

  useEffect(() => {
    if (!editingVendor) {
      setForm(EMPTY_FORM);
      setSendEmail(true);
      return;
    }

    setForm({
      companyName: editingVendor.companyName || "",
      vendorRep: editingVendor.vendorRep || "",
      repPhone: editingVendor.repPhone || "",
      email: editingVendor.email || "",
      address: editingVendor.address || "",
      mainProduct: editingVendor.mainProduct || "",
      businessCategory: editingVendor.businessCategory || "",
      serviceDescription: editingVendor.serviceDescription || "",
      paymentTerms: editingVendor.paymentTerms || "",
      bankName: editingVendor.bankName || "",
      accountName: editingVendor.accountName || "",
      accountNumber: editingVendor.accountNumber || "",
    });
    setSendEmail(false);
  }, [editingVendor]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    const isEditing = Boolean(editingVendor);
    const endpoint = isEditing
      ? `/api/vendors/${editingVendor._id}`
      : "/api/vendors/petty-cash/invite";
    const method = isEditing ? "PUT" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          vendorType: PETTY_CASH_VENDOR_TYPE,
          sendEmail: !isEditing && sendEmail && Boolean(form.email.trim()),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Request failed");
      }

      onSuccess && onSuccess(data);
    } catch (error) {
      console.error("Petty cash vendor form error:", error);
      alert(error.message || "Unable to save vendor details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 p-6 bg-white rounded-xl border border-gray-200 shadow-md max-h-[80vh] overflow-y-auto"
    >
      <div>
        <h2 className="text-xl font-semibold text-blue-700 mb-4">
          Vendor Contact Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            ["companyName", "Business Name", true],
            ["vendorRep", "Representative Name", false],
            ["repPhone", "Phone Number", false],
            ["email", "Email Address", false],
          ].map(([field, label, required]) => (
            <div key={field}>
              <label className="text-sm text-gray-700 mb-1 block">{label}</label>
              <input
                name={field}
                value={form[field]}
                onChange={handleChange}
                className="border p-3 rounded w-full"
                required={required}
                type={field === "email" ? "email" : "text"}
              />
            </div>
          ))}

          <div className="md:col-span-2">
            <label className="text-sm text-gray-700 mb-1 block">
              Business Address
            </label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              className="border p-3 rounded w-full"
              placeholder="Registered address or operating address"
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-blue-700 mb-4">
          Petty Cash Profile
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-700 mb-1 block">
              Primary Item or Service
            </label>
            <input
              name="mainProduct"
              value={form.mainProduct}
              onChange={handleChange}
              className="border p-3 rounded w-full"
              placeholder="e.g. emergency electrical fix, office supplies"
            />
          </div>
          <div>
            <label className="text-sm text-gray-700 mb-1 block">
              Business Category
            </label>
            <input
              name="businessCategory"
              value={form.businessCategory}
              onChange={handleChange}
              className="border p-3 rounded w-full"
              placeholder="e.g. maintenance, transport, consumables"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-gray-700 mb-1 block">
              Service Description
            </label>
            <textarea
              name="serviceDescription"
              value={form.serviceDescription}
              onChange={handleChange}
              className="border p-3 rounded w-full min-h-28"
              placeholder="Describe the goods or services this vendor provides"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-gray-700 mb-1 block">
              Payment Terms
            </label>
            <textarea
              name="paymentTerms"
              value={form.paymentTerms}
              onChange={handleChange}
              className="border p-3 rounded w-full min-h-24"
              placeholder="Optional notes such as turnaround time, delivery expectation, or invoice terms"
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-blue-700 mb-4">
          Bank Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            ["bankName", "Bank Name"],
            ["accountName", "Account Name"],
            ["accountNumber", "Account Number"],
          ].map(([field, label]) => (
            <div key={field}>
              <label className="text-sm text-gray-700 mb-1 block">{label}</label>
              <input
                name={field}
                value={form[field]}
                onChange={handleChange}
                className="border p-3 rounded w-full"
              />
            </div>
          ))}
        </div>
      </div>

      {!editingVendor && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-2">
          <label className="flex items-start gap-3 text-sm text-blue-900 font-medium">
            <input
              type="checkbox"
              className="mt-1"
              checked={sendEmail}
              onChange={(event) => setSendEmail(event.target.checked)}
              disabled={!form.email.trim()}
            />
            Send the onboarding email immediately after creating this vendor.
          </label>
          <p className="text-xs text-blue-800">
            If no email address is available yet, create the vendor anyway and copy
            the generated onboarding link manually.
          </p>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={loading}
          className={`px-6 py-2 font-medium rounded transition ${
            loading
              ? "bg-blue-400 cursor-not-allowed text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {loading
            ? editingVendor
              ? "Saving..."
              : "Creating..."
            : editingVendor
            ? "Save Vendor"
            : "Create Vendor"}
        </button>
      </div>
    </form>
  );
}