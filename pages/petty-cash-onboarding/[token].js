import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import {
  PETTY_CASH_TERMS,
  PETTY_CASH_TERMS_VERSION,
} from "@/lib/petty-cash";

const EMPTY_FORM = {
  companyName: "",
  vendorRep: "",
  repPhone: "",
  email: "",
  address: "",
  mainProduct: "",
  businessCategory: "",
  serviceDescription: "",
  bankName: "",
  accountName: "",
  accountNumber: "",
  termsAccepted: false,
};

const BASIC_FIELDS = [
  ["companyName", "Business Name", "text", true],
  ["vendorRep", "Representative Name", "text", true],
  ["repPhone", "Phone Number", "tel", true],
  ["email", "Email Address", "email", true],
  ["mainProduct", "Primary Item or Service", "text", false],
  ["businessCategory", "Business Category (Optional)", "text", false],
];

const BANK_FIELDS = [
  ["bankName", "Bank Name"],
  ["accountName", "Account Name"],
  ["accountNumber", "Account Number"],
];

const createEmptyProduct = () => ({ name: "", price: "" });

export default function PettyCashVendorOnboarding() {
  const router = useRouter();
  const { token } = router.query;

  const [vendorInfo, setVendorInfo] = useState(null);
  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    products: [createEmptyProduct()],
  }));
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleCloseWindow = useCallback(() => {
    if (typeof window === "undefined") return;

    window.open("", "_self");
    window.close();

    window.setTimeout(() => {
      window.location.replace("/");
    }, 150);
  }, []);

  useEffect(() => {
    if (!token) return;

    const fetchVendorInfo = async () => {
      try {
        const response = await fetch(`/api/vendors/onboarding/${token}`);
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || "Unable to load onboarding form.");
        }

        const data = await response.json();
        setVendorInfo(data);
        setForm({
          companyName: data.companyName || "",
          vendorRep: data.vendorRep || "",
          repPhone: data.repPhone || "",
          email: data.email || "",
          address: data.address || "",
          mainProduct: data.mainProduct || "",
          businessCategory: data.businessCategory || "",
          serviceDescription: data.serviceDescription || "",
          products:
            Array.isArray(data.products) && data.products.length > 0
              ? data.products.map((product) => ({
                  name: product.name || "",
                  price: product.price || "",
                }))
              : [createEmptyProduct()],
          bankName: data.bankName || "",
          accountName: data.accountName || "",
          accountNumber: data.accountNumber || "",
          termsAccepted: Boolean(data.termsAccepted),
        });
      } catch (fetchError) {
        console.error(fetchError);
        setError(fetchError.message || "Unable to load onboarding form.");
      } finally {
        setLoading(false);
      }
    };

    fetchVendorInfo();
  }, [token]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
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
      products: [...(prev.products || []), createEmptyProduct()],
    }));
  };

  const removeProductRow = (index) => {
    setForm((prev) => {
      const nextProducts = prev.products.filter((_, productIndex) => productIndex !== index);

      return {
        ...prev,
        products: nextProducts.length ? nextProducts : [createEmptyProduct()],
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/vendors/onboarding/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Submission failed.");
      }

      setSuccess(true);
    } catch (submitError) {
      console.error(submitError);
      setError(submitError.message || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#eff6ff_55%,_#f8fafc)] flex items-center justify-center px-4 py-8">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !vendorInfo) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#eff6ff_55%,_#f8fafc)] flex items-center justify-center px-4">
        <div className="max-w-md rounded-3xl bg-white border border-blue-200 shadow-xl p-8 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-blue-600">
            Petty Cash Vendor
          </p>
          <h1 className="text-2xl font-bold text-slate-900 mt-3">Link Invalid</h1>
          <p className="text-sm text-slate-600 mt-3">{error}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#ecfeff,_#dbeafe_45%,_#f8fafc)] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg rounded-[28px] bg-white border border-blue-200 shadow-xl p-5 sm:p-8 text-center space-y-4">
          <p className="text-sm uppercase tracking-[0.3em] text-blue-600">
            Submission Complete
          </p>
          <h1 className="text-3xl font-bold text-slate-900">Thank you</h1>
          <p className="text-sm sm:text-base text-slate-600 leading-7">
            Your petty cash vendor onboarding form has been submitted successfully.
            Ibile will review the details you provided and contact you if any
            clarification is needed.
          </p>
          <button
            type="button"
            onClick={handleCloseWindow}
            className="w-full rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Ibile Petty Cash Vendor Onboarding</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#eff6ff_55%,_#f8fafc)] py-6 sm:py-10 px-3 sm:px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-4 sm:gap-6">
          <section className="rounded-[28px] bg-white/95 border border-white shadow-[0_24px_80px_rgba(15,23,42,0.12)] p-4 sm:p-8">
            <div className="space-y-3 mb-6 sm:mb-8">
              <div className="flex flex-wrap items-center gap-3">
                <Image
                  src="/image/Logo.png"
                  alt="Ibile logo"
                  width={52}
                  height={52}
                  className="h-12 w-12 object-contain"
                />
                <p className="text-xs uppercase tracking-[0.3em] text-blue-700">
                  Ibile Vendor Network
                </p>
              </div>
              <h1 className="text-2xl sm:text-4xl font-semibold text-slate-900 leading-tight">
                Petty Cash Vendor Onboarding
              </h1>
              <p className="text-sm sm:text-base text-slate-600 max-w-2xl">
                Complete this form to join the Ibile petty cash vendor database.
                The information you submit will be used for vendor registration,
                contact verification, payment processing, and internal audit records.
              </p>
            </div>

            {vendorInfo?.onboardingComplete && (
              <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                This onboarding form has already been submitted. You may review and
                update the existing details below if a correction is required.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {BASIC_FIELDS.map(([name, label, type, required]) => (
                  <label key={name} className="space-y-2 text-sm text-slate-700">
                    <span className="font-medium">{label}</span>
                    <input
                      type={type}
                      name={name}
                      value={form[name]}
                      onChange={handleChange}
                      required={required}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 bg-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </label>
                ))}

                <label className="space-y-2 text-sm text-slate-700 sm:col-span-2">
                  <span className="font-medium">Business Address (Optional)</span>
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 min-h-24 bg-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Optional"
                  />
                </label>

                <label className="space-y-2 text-sm text-slate-700 sm:col-span-2">
                  <span className="font-medium">Discussion / Service Description (Optional)</span>
                  <textarea
                    name="serviceDescription"
                    value={form.serviceDescription}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 min-h-28 bg-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Describe the goods or services you provide for petty cash requests."
                  />
                </label>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Products and Prices</h2>
                    <p className="text-sm text-slate-600 mt-1">
                      Add the products you sell and the current price for each item.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addProductRow}
                    className="w-full sm:w-auto rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 transition"
                  >
                    + Add Product
                  </button>
                </div>

                <div className="space-y-3">
                  {form.products.map((product, index) => (
                    <div
                      key={`product-row-${index}`}
                      className="rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <p className="text-sm font-medium text-slate-900">Product {index + 1}</p>
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

                      <div className="grid grid-cols-1 sm:grid-cols-[1.4fr_0.8fr] gap-4">
                        <label className="space-y-2 text-sm text-slate-700">
                          <span className="font-medium">Product Name</span>
                          <input
                            type="text"
                            value={product.name}
                            onChange={(event) =>
                              handleProductChange(index, "name", event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 bg-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            placeholder="e.g. Soft drinks, printer paper"
                          />
                        </label>

                        <label className="space-y-2 text-sm text-slate-700">
                          <span className="font-medium">Price (N)</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={product.price}
                            onChange={(event) =>
                              handleProductChange(index, "price", event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 bg-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            placeholder="0.00"
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Bank Details
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {BANK_FIELDS.map(([name, label]) => (
                    <label key={name} className="space-y-2 text-sm text-slate-700">
                      <span className="font-medium">{label}</span>
                      <input
                        type="text"
                        name={name}
                        value={form[name]}
                        onChange={handleChange}
                        required
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 bg-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <label className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="termsAccepted"
                  checked={form.termsAccepted}
                  onChange={handleChange}
                  className="mt-1"
                />
                <span>
                  I have read and accept the Ibile petty cash vendor terms and
                  conditions stated on this page, including version {PETTY_CASH_TERMS_VERSION}.
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-blue-700 text-white py-3.5 font-semibold hover:bg-blue-800 disabled:opacity-60 transition"
              >
                {submitting ? "Submitting..." : "Submit Onboarding Form"}
              </button>
            </form>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[28px] bg-gradient-to-br from-blue-700 to-sky-600 text-white p-5 sm:p-6 shadow-[0_24px_80px_rgba(37,99,235,0.24)]">
              <p className="text-xs uppercase tracking-[0.3em] text-blue-100">
                Why this form matters
              </p>
              <h2 className="text-2xl font-semibold mt-3">
                Welcome to the Ibile vendor network.
              </h2>
              <p className="text-sm text-blue-50 mt-4 leading-6">
                This form helps Ibile keep accurate vendor records for
                communication, order processing, internal review, and operational
                documentation.
              </p>
            </section>

            <section className="rounded-[28px] bg-white/95 border border-white shadow-[0_24px_80px_rgba(15,23,42,0.12)] p-5 sm:p-6">
              <div className="space-y-2 mb-5">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  Terms and Conditions
                </p>
                <h2 className="text-2xl font-semibold text-slate-900">
                  Vendor Agreement Summary
                </h2>
              </div>

              <div className="space-y-4">
                {PETTY_CASH_TERMS.map((term) => (
                  <div
                    key={term.title}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <h3 className="text-sm font-semibold text-slate-900">
                      {term.title}
                    </h3>
                    <p className="text-sm text-slate-600 mt-1 leading-6">
                      {term.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </>
  );
}