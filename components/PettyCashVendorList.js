import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

function formatDate(value) {
  if (!value) return "Not yet available";

  return new Date(value).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function PettyCashVendorList({
  vendors,
  onCopyLink,
  onEdit,
  onSendInvite,
  copiedVendorId,
  sendingInviteKey,
}) {
  const [expandedIndex, setExpandedIndex] = useState(null);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
      {vendors.length ? (
        vendors.map((vendor, index) => {
          const isExpanded = expandedIndex === index;
          const statusLabel = vendor.onboardingComplete ? "Onboarded" : "Pending";

          return (
            <motion.div
              key={vendor._id || index}
              layout
              onClick={() =>
                setExpandedIndex((current) => (current === index ? null : index))
              }
              transition={{ layout: { duration: 0.3, type: "spring" } }}
              className={`group cursor-pointer border border-gray-300 rounded-sm sm:rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all ${
                isExpanded ? "p-4 rounded-sm" : "px-3 py-1"
              }`}
            >
              <div className="flex items-center justify-between space-x-2">
                <div className="flex-1 truncate text-xs font-medium text-gray-700">
                  {vendor.companyName}
                </div>
                <motion.span
                  layout
                  className={`text-[10px] px-2 py-0.5 rounded-sm font-medium transition ${
                    vendor.onboardingComplete
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {statusLabel}
                </motion.span>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    key="expanded"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 space-y-1 text-xs text-gray-600"
                  >
                    <p><strong>Rep:</strong> {vendor.vendorRep || "Not set"}</p>
                    <p><strong>Phone:</strong> {vendor.repPhone || "Not set"}</p>
                    <p><strong>Email:</strong> {vendor.email || "Not set"}</p>
                    <p>
                      <strong>Category:</strong>{" "}
                      {vendor.businessCategory || vendor.mainProduct || "Not set"}
                    </p>
                    <p>
                      <strong>Service:</strong>{" "}
                      {vendor.serviceDescription || "Waiting for onboarding details"}
                    </p>
                    <p>
                      <strong>Terms Accepted:</strong>{" "}
                      {vendor.termsAccepted ? "Yes" : "No"}
                    </p>
                    <p>
                      <strong>Invite Sent:</strong> {formatDate(vendor.onboardingSentAt)}
                    </p>
                    <p>
                      <strong>Submitted:</strong> {formatDate(vendor.onboardingSubmittedAt)}
                    </p>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onCopyLink(vendor);
                        }}
                        className="text-xs px-3 py-1 border border-green-600 text-green-600 rounded-full font-medium hover:bg-green-600 hover:text-white transition"
                      >
                        {copiedVendorId === vendor._id ? "Copied" : "Copy Link"}
                      </button>
                      {[
                        ["email", "Send Email", "border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white"],
                        ["sms", "Send SMS", "border-slate-500 text-slate-600 hover:bg-slate-600 hover:text-white"],
                        ["whatsapp", "WhatsApp", "border-green-600 text-green-600 hover:bg-green-600 hover:text-white"],
                      ].map(([channel, label, className]) => {
                        const isSending = sendingInviteKey === `${vendor._id}:${channel}`;

                        return (
                          <button
                            key={channel}
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              onSendInvite(vendor, channel);
                            }}
                            disabled={isSending}
                            className={`text-xs px-3 py-1 border rounded-full font-medium transition ${
                              isSending
                                ? "border-gray-300 text-gray-400 cursor-not-allowed"
                                : className
                            }`}
                          >
                            {isSending ? "Sending..." : label}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onEdit(vendor);
                        }}
                        className="text-xs px-3 py-1 border border-blue-600 text-blue-600 rounded-full font-medium hover:bg-blue-600 hover:text-white transition"
                      >
                        Edit
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })
      ) : (
        <p className="text-gray-500 col-span-full text-center py-8 text-sm">
          No petty cash vendors available.
        </p>
      )}
    </div>
  );
}