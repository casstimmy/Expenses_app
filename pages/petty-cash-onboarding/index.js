import Head from "next/head";
import { useState } from "react";
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
  paymentTerms: "",
  bankName: "",
  accountName: "",
  accountNumber: "",
  termsAccepted: false,
};

export default function PublicPettyCashVendorOnboarding() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/vendors/onboarding/public", {
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

  if (success) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#ecfccb,_#dcfce7_45%,_#f8fafc)] flex items-center justify-center px-4">
        <div className="max-w-xl rounded-3xl bg-white border border-emerald-200 shadow-xl p-8 text-center space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-600">Submission Complete</p>
          <h1 className="text-3xl font-bold text-slate-900">Thank you</h1>
          <p className="text-sm text-slate-600">
            Your petty cash vendor onboarding form has been submitted successfully.
            A petty cash vendor record has been created and BizSuits will review
            the details you provided.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Petty Cash Vendor Onboarding</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff7ed,_#e0f2fe_55%,_#f8fafc)] py-10 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-6">
          <section className="rounded-[28px] bg-white/95 border border-white shadow-[0_24px_80px_rgba(15,23,42,0.12)] p-6 sm:p-8">
            <div className="space-y-3 mb-8">
              <p className="text-xs uppercase tracking-[0.3em] text-amber-700">
                BizSuits Vendor Network
              </p>
              <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900">
                Petty Cash Vendor Onboarding
              </h1>
              <p className="text-sm sm:text-base text-slate-600 max-w-2xl">
                Complete this form to join the BizSuits petty cash vendor database.
                Once you submit, your petty cash vendor profile will be created
                automatically for review and payment setup.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  ["companyName", "Business Name", "text", true],
                  ["vendorRep", "Representative Name", "text", true],
                  ["repPhone", "Phone Number", "tel", true],
                  ["email", "Email Address", "email", true],
                  ["mainProduct", "Primary Item or Service", "text", false],
                  ["businessCategory", "Business Category", "text", true],
                ].map(([name, label, type, required]) => (
                  <label key={name} className="space-y-2 text-sm text-slate-700">
                    <span className="font-medium">{label}</span>
                    <input
                      type={type}
                      name={name}
                      value={form[name]}
                      onChange={handleChange}
                      required={required}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 bg-white focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                    />
                  </label>
                ))}

                <label className="space-y-2 text-sm text-slate-700 sm:col-span-2">
                  <span className="font-medium">Business Address</span>
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 min-h-24 bg-white focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                  />
                </label>

                <label className="space-y-2 text-sm text-slate-700 sm:col-span-2">
                  <span className="font-medium">Service Description</span>
                  <textarea
                    name="serviceDescription"
                    value={form.serviceDescription}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 min-h-28 bg-white focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                    placeholder="Describe the goods or services you provide for petty cash requests."
                  />
                </label>

                <label className="space-y-2 text-sm text-slate-700 sm:col-span-2">
                  <span className="font-medium">Payment Terms</span>
                  <textarea
                    name="paymentTerms"
                    value={form.paymentTerms}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 min-h-24 bg-white focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                    placeholder="State expected payment timing, delivery conditions, or invoice notes if applicable."
                  />
                </label>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Bank Details</h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Payment will only be made into the account registered here.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    ["bankName", "Bank Name"],
                    ["accountName", "Account Name"],
                    ["accountNumber", "Account Number"],
                  ].map(([name, label]) => (
                    <label key={name} className="space-y-2 text-sm text-slate-700">
                      <span className="font-medium">{label}</span>
                      <input
                        type="text"
                        name={name}
                        value={form[name]}
                        onChange={handleChange}
                        required
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 bg-white focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
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

              <label className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="termsAccepted"
                  checked={form.termsAccepted}
                  onChange={handleChange}
                  className="mt-1"
                />
                <span>
                  I have read and accept the BizSuits petty cash vendor terms and
                  conditions stated on this page, including version {PETTY_CASH_TERMS_VERSION}.
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-slate-900 text-white py-3.5 font-semibold hover:bg-slate-800 disabled:opacity-60 transition"
              >
                {submitting ? "Submitting..." : "Submit Onboarding Form"}
              </button>
            </form>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[28px] bg-[#0f172a] text-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
              <p className="text-xs uppercase tracking-[0.3em] text-amber-300">Why this form matters</p>
              <h2 className="text-2xl font-semibold mt-3">Clear vendor records reduce payment delays.</h2>
              <p className="text-sm text-slate-300 mt-4 leading-6">
                BizSuits uses this form to confirm who it is paying, what goods or
                services are being supplied, and which bank account should be used
                for approved petty cash disbursements.
              </p>
            </section>

            <section className="rounded-[28px] bg-white/95 border border-white shadow-[0_24px_80px_rgba(15,23,42,0.12)] p-6">
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
                    <h3 className="text-sm font-semibold text-slate-900">{term.title}</h3>
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