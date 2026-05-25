import { useEffect, useState } from "react";
import { PETTY_CASH_VENDOR_TYPE } from "@/lib/petty-cash";

const createEmptyProduct = (fallbackCategory = "") => ({
  product: "custom",
  name: "",
  category: fallbackCategory,
  price: "",
});

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
  products: [createEmptyProduct()],
};

export default function PettyCashVendorForm({
  editingVendor = null,
  onSuccess,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [channels, setChannels] = useState({
    email: true,
    sms: false,
    whatsapp: false,
  });

  useEffect(() => {
    if (!editingVendor) {
      setForm(EMPTY_FORM);
      setChannels({ email: true, sms: false, whatsapp: false });
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
      products:
        Array.isArray(editingVendor.products) && editingVendor.products.length > 0
          ? editingVendor.products.map((entry) => ({
              product: entry.product?._id || "custom",
              name: entry.product?.name || "",
              category:
                entry.product?.category || editingVendor.businessCategory || "Petty Cash",
              price: entry.price ? String(entry.price) : "",
            }))
          : [createEmptyProduct(editingVendor.businessCategory || "")],
    });
    setChannels({ email: false, sms: false, whatsapp: false });
  }, [editingVendor]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProductChange = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      products: prev.products.map((product, productIndex) =>
        productIndex === index ? { ...product, [field]: value } : product
      ),
    }));
  };

  const addProductRow = () => {
    setForm((prev) => ({
      ...prev,
      products: [...prev.products, createEmptyProduct(prev.businessCategory || "Petty Cash")],
    }));
  };

  const removeProductRow = (index) => {
    setForm((prev) => {
      const nextProducts = prev.products.filter((_, productIndex) => productIndex !== index);

      return {
        ...prev,
        products: nextProducts.length ? nextProducts : [createEmptyProduct(prev.businessCategory || "")],
      };
    });
  };

  const toggleChannel = (channel) => {
    setChannels((prev) => ({ ...prev, [channel]: !prev[channel] }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    const isEditing = Boolean(editingVendor);
    const endpoint = isEditing
      ? `/api/vendors/${editingVendor._id}`
      : "/api/vendors/petty-cash/invite";
    const method = isEditing ? "PUT" : "POST";

    const hasIncompleteProduct = form.products.some((product) => {
      const hasAnyValue =
        Boolean(String(product.name || "").trim()) ||
        Boolean(String(product.price ?? "").trim());

      return hasAnyValue && (!String(product.name || "").trim() || Number(product.price) <= 0);
    });

    if (hasIncompleteProduct) {
      alert("Please provide both product name and a valid price for each product row.");
      setLoading(false);
      return;
    }

    const formattedProducts = form.products
      .map((product) => ({
        product:
          typeof product.product === "string" && product.product && product.product !== "custom"
            ? product.product
            : "custom",
        name: String(product.name || "").trim(),
        category:
          String(product.category || form.businessCategory || "Petty Cash").trim() ||
          "Petty Cash",
        price: Number(product.price) || 0,
      }))
      .filter((product) => product.name && product.price > 0);

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          products: formattedProducts,
          vendorType: PETTY_CASH_VENDOR_TYPE,
          channels: !isEditing
            ? Object.entries(channels)
                .filter(([channel, enabled]) => {
                  if (!enabled) return false;
                  if (channel === "email") return Boolean(form.email.trim());
                  return Boolean(form.repPhone.trim());
                })
                .map(([channel]) => channel)
            : [],
          sendEmail: !isEditing && channels.email && Boolean(form.email.trim()),
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
      className="space-y-6 sm:space-y-8 p-4 sm:p-6 bg-white rounded-xl border border-gray-200 shadow-md max-h-[calc(92vh-5rem)] overflow-y-auto"
    >
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-blue-700 mb-4">
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-blue-700">
            Products and Prices
          </h2>
          <button
            type="button"
            onClick={addProductRow}
            className="w-full sm:w-auto rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition"
          >
            + Add Product
          </button>
        </div>

        <div className="space-y-4">
          {form.products.map((product, index) => (
            <div
              key={`vendor-product-${index}`}
              className="rounded-xl border border-gray-200 bg-gray-50 p-4"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <h3 className="text-sm font-medium text-gray-700">Product {index + 1}</h3>
                {form.products.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeProductRow(index)}
                    className="text-sm font-medium text-red-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm text-gray-700 mb-1 block">Product Name</label>
                  <input
                    value={product.name}
                    onChange={(event) =>
                      handleProductChange(index, "name", event.target.value)
                    }
                    className="border p-3 rounded w-full"
                    placeholder="e.g. Cleaning supplies, office stationery"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-700 mb-1 block">Price (N)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={product.price}
                    onChange={(event) =>
                      handleProductChange(index, "price", event.target.value)
                    }
                    className="border p-3 rounded w-full"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-blue-700 mb-4">
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
              Service Description / Discussion (Optional)
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
        <h2 className="text-lg sm:text-xl font-semibold text-blue-700 mb-4">
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
          <p className="text-sm text-blue-900 font-medium">
            Send onboarding link immediately after creating this vendor.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              ["email", "Email", Boolean(form.email.trim())],
              ["sms", "SMS", Boolean(form.repPhone.trim())],
              ["whatsapp", "WhatsApp", Boolean(form.repPhone.trim())],
            ].map(([channel, label, enabled]) => (
              <label
                key={channel}
                className={`flex items-start gap-3 text-sm rounded-lg border px-3 py-3 ${
                  enabled
                    ? "border-blue-200 bg-white text-blue-900"
                    : "border-gray-200 bg-gray-100 text-gray-400"
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={channels[channel]}
                  onChange={() => toggleChannel(channel)}
                  disabled={!enabled}
                />
                <span>
                  <span className="font-medium block">{label}</span>
                  <span className="text-xs">
                    {channel === "email"
                      ? enabled
                        ? "Uses vendor email address"
                        : "Add an email address to enable"
                      : enabled
                      ? "Uses vendor phone number"
                      : "Add a phone number to enable"}
                  </span>
                </span>
              </label>
            ))}
          </div>
          <p className="text-xs text-blue-800">
            You can still create the vendor without sending any channel now and copy the generated onboarding link manually afterward.
          </p>
        </div>
      )}

      <div className="flex justify-stretch sm:justify-end pt-2">
        <button
          type="submit"
          disabled={loading}
          className={`w-full sm:w-auto px-6 py-3 sm:py-2 font-medium rounded transition ${
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