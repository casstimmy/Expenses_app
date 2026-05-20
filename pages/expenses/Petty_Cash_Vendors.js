import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import PettyCashTransactionPanel from "@/components/PettyCashTransactionPanel";
import PettyCashVendorForm from "@/components/PettyCashVendorForm";
import PettyCashVendorList from "@/components/PettyCashVendorList";

const CACHE_KEY = "petty_cash_vendors_cache";
const CACHE_DURATION = 10 * 60 * 1000;

function buildInvitePayload(vendor) {
  return {
    vendorId: vendor._id,
    companyName: vendor.companyName || "",
    vendorRep: vendor.vendorRep || "",
    repPhone: vendor.repPhone || "",
    email: vendor.email || "",
    address: vendor.address || "",
    mainProduct: vendor.mainProduct || "",
    businessCategory: vendor.businessCategory || "",
    serviceDescription: vendor.serviceDescription || "",
    paymentTerms: vendor.paymentTerms || "",
    bankName: vendor.bankName || "",
    accountName: vendor.accountName || "",
    accountNumber: vendor.accountNumber || "",
  };
}

export default function PettyCashVendorsPage() {
  const [staff, setStaff] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [search, setSearch] = useState("");
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [copiedVendorId, setCopiedVendorId] = useState(null);
  const [sendingInviteKey, setSendingInviteKey] = useState("");
  const [inviteResult, setInviteResult] = useState(null);

  const loadVendors = async ({ ignoreCache = false } = {}) => {
    setLoadingVendors(true);

    try {
      if (!ignoreCache) {
        const cachedData = localStorage.getItem(CACHE_KEY);

        if (cachedData) {
          try {
            const { timestamp, data } = JSON.parse(cachedData);
            if (Date.now() - timestamp < CACHE_DURATION && Array.isArray(data)) {
              setVendors(data);
              setLoadingVendors(false);
              return;
            }
          } catch (error) {
            console.warn("Invalid petty cash vendor cache, reloading...");
          }
        }
      }

      const response = await fetch("/api/vendors?type=petty-cash");
      if (!response.ok) {
        throw new Error("Failed to load petty cash vendors");
      }

      const data = await response.json();
      setVendors(data);
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ timestamp: Date.now(), data })
      );
    } catch (error) {
      console.error("Failed to load petty cash vendors:", error);
      localStorage.removeItem(CACHE_KEY);
    } finally {
      setLoadingVendors(false);
    }
  };

  useEffect(() => {
    const storedStaff = localStorage.getItem("staff");
    if (storedStaff) {
      setStaff(JSON.parse(storedStaff));
    }

    loadVendors();
  }, []);

  const filteredVendors = useMemo(() => {
    if (!search.trim()) return vendors;

    const query = search.toLowerCase();
    return vendors.filter((vendor) =>
      [
        vendor.companyName,
        vendor.vendorRep,
        vendor.email,
        vendor.businessCategory,
        vendor.mainProduct,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [search, vendors]);

  const onboardedCount = vendors.filter((vendor) => vendor.onboardingComplete).length;
  const pendingCount = vendors.length - onboardedCount;

  const copyText = async (text) => {
    await navigator.clipboard.writeText(text);
  };

  const requestInvite = async ({ payload, channels = [], copyAfter = false }) => {
    const inviteKey = `${payload.vendorId || "new"}:${channels[0] || "copy"}`;
    setSendingInviteKey(inviteKey);

    try {
      const response = await fetch("/api/vendors/petty-cash/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          channels,
          sendEmail: channels.includes("email"),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to send onboarding link");
      }

      await loadVendors({ ignoreCache: true });

      setInviteResult({
        vendorId: data.vendor?._id || payload.vendorId || "",
        companyName: data.vendor?.companyName || payload.companyName,
        onboardingLink: data.onboardingLink,
        delivery: data.delivery || null,
        emailSent: data.emailSent,
        emailError: data.emailError,
      });

      if (copyAfter && data.onboardingLink) {
        await copyText(data.onboardingLink);
        setCopiedVendorId(data.vendor?._id || payload.vendorId || null);
        setTimeout(() => setCopiedVendorId(null), 2000);
      }

      const channelErrors = Object.values(data.delivery || {})
        .map((entry) => entry?.error)
        .filter(Boolean);

      if (channelErrors.length > 0) {
        alert(channelErrors.join("\n"));
      }
    } catch (error) {
      console.error("Petty cash invite request failed:", error);
      alert(error.message || "Unable to send onboarding link.");
    } finally {
      setSendingInviteKey("");
    }
  };

  const handleCopyLink = async (vendor) => {
    if (vendor.onboardingToken) {
      const onboardingLink = `${window.location.origin}/petty-cash-onboarding/${vendor.onboardingToken}`;
      await copyText(onboardingLink);
      setInviteResult({
        vendorId: vendor._id,
        companyName: vendor.companyName,
        onboardingLink,
        delivery: null,
        emailSent: false,
        emailError: "",
      });
      setCopiedVendorId(vendor._id);
      setTimeout(() => setCopiedVendorId(null), 2000);
      return;
    }

    await requestInvite({
      payload: buildInvitePayload(vendor),
      channels: [],
      copyAfter: true,
    });
  };

  const handleSendInvite = async (vendor, channel) => {
    await requestInvite({
      payload: buildInvitePayload(vendor),
      channels: [channel],
    });
  };

  const renderDeliveryMessage = () => {
    if (!inviteResult?.delivery) {
      return "Share the link manually if email delivery is not available.";
    }

    const labels = {
      email: "Email",
      sms: "SMS",
      whatsapp: "WhatsApp",
    };

    const messages = Object.entries(inviteResult.delivery)
      .filter(([, entry]) => entry?.requested)
      .map(([channel, entry]) =>
        entry.sent
          ? `${labels[channel]} sent successfully.`
          : entry.error || `${labels[channel]} was not sent.`
      );

    return messages.join(" ") || "Onboarding link is ready to share.";
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 p-3 sm:p-6">
        <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-800">
              Petty Cash Vendors
            </h1>
            <p className="text-sm text-gray-600 max-w-3xl">
              Manage petty cash vendors separately from stock-order vendors while
              keeping them in the same database. Invite vendors with a secure link,
              track onboarding status, and update their profile when they submit.
            </p>
          </div>

          {staff && (
            <div className="p-3 sm:p-4 rounded-xl bg-blue-50 border border-blue-200 shadow-sm">
              <p className="text-sm text-blue-900 font-medium">
                Logged in as <span className="font-semibold">{staff.name}</span>
                {" "}| Location: <span className="font-semibold">{staff.location}</span>
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              ["Total Vendors", vendors.length, "bg-white border-gray-200"],
              ["Onboarded", onboardedCount, "bg-green-50 border-green-200"],
              ["Pending", pendingCount, "bg-amber-50 border-amber-200"],
            ].map(([label, value, className]) => (
              <div key={label} className={`rounded-xl border p-4 shadow-sm ${className}`}>
                <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
              </div>
            ))}
          </div>

          {inviteResult?.onboardingLink && (
            <div className="rounded-xl border border-blue-200 bg-white p-4 shadow-sm space-y-3">
              <div>
                <h2 className="text-base font-semibold text-blue-800">
                  Onboarding Link Ready
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {inviteResult.companyName || "Vendor"} can complete onboarding with
                  the link below.
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-sm break-all text-gray-700">
                {inviteResult.onboardingLink}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => copyText(inviteResult.onboardingLink)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                >
                  Copy Link
                </button>
                <p className="text-xs text-gray-500">
                  {renderDeliveryMessage()}
                </p>
              </div>
            </div>
          )}

          <section className="bg-white p-3 sm:p-6 rounded shadow relative space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 w-full">
              <label
                htmlFor="searchVendor"
                className="text-sm font-medium text-gray-700 whitespace-nowrap"
              >
                Search Vendor
              </label>

              <input
                id="searchVendor"
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by company, rep, email, or category"
                className="flex-grow border border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md px-3 py-2 text-sm transition-all duration-200"
              />
            </div>

            <div className="flex justify-between items-center gap-3">
              <h2 className="text-xl font-semibold text-gray-800">
                Vendor Directory
              </h2>
              <button
                type="button"
                onClick={() => {
                  setEditingVendor(null);
                  setShowVendorForm(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
              >
                + Invite Vendor
              </button>
            </div>

            <div className="relative">
              {loadingVendors && (
                <div className="absolute inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-10">
                  <div className="w-10 h-10 border-4 border-white border-t-blue-600 rounded-full animate-spin" />
                </div>
              )}

              <PettyCashVendorList
                vendors={filteredVendors}
                onCopyLink={handleCopyLink}
                onEdit={(vendor) => {
                  setEditingVendor(vendor);
                  setShowVendorForm(true);
                }}
                onSendInvite={handleSendInvite}
                copiedVendorId={copiedVendorId}
                sendingInviteKey={sendingInviteKey}
              />
            </div>
          </section>

          <PettyCashTransactionPanel vendors={vendors} staff={staff} />

          {showVendorForm && (
            <div className="fixed inset-0 backdrop-blur-md bg-white/30 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-4 sm:p-6 mx-3 sm:mx-0 relative">
                <div className="flex justify-between items-center border-b pb-2 mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {editingVendor ? "Edit Petty Cash Vendor" : "Invite Petty Cash Vendor"}
                  </h2>
                  <button
                    type="button"
                    className="text-gray-600 hover:text-red-500 text-xl"
                    onClick={() => {
                      setShowVendorForm(false);
                      setEditingVendor(null);
                    }}
                  >
                    &times;
                  </button>
                </div>

                <PettyCashVendorForm
                  editingVendor={editingVendor}
                  onSuccess={async (data) => {
                    setShowVendorForm(false);
                    setEditingVendor(null);
                    if (data.onboardingLink) {
                      setInviteResult({
                        vendorId: data.vendor?._id || "",
                        companyName: data.vendor?.companyName,
                        onboardingLink: data.onboardingLink,
                        delivery: data.delivery || null,
                        emailSent: data.emailSent,
                        emailError: data.emailError,
                      });
                    } else {
                      setInviteResult(null);
                    }
                    await loadVendors({ ignoreCache: true });
                    if (!data.onboardingLink) {
                      alert("Vendor details saved successfully.");
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}