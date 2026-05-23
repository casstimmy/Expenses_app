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
  onEdit,
  onDelete,
  onPlaceOrder,
  deletingVendorId,
}) {
  const [expandedIndex, setExpandedIndex] = useState(null);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 w-full">
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
              className={`group cursor-pointer border border-gray-300 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all ${
                isExpanded ? "p-4" : "p-3 sm:p-4"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0 truncate text-sm font-medium text-gray-700">
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
                    className="mt-3 space-y-2 text-xs sm:text-sm text-gray-600 break-words"
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
                    {Array.isArray(vendor.products) && vendor.products.length > 0 && (
                      <p>
                        <strong>Products:</strong>{" "}
                        {vendor.products
                          .slice(0, 3)
                          .map((entry) => {
                            const name = entry.product?.name || "Product";
                            const price = Number(entry.price || 0).toLocaleString("en-NG");
                            return `${name} (N${price})`;
                          })
                          .join(", ")}
                        {vendor.products.length > 3
                          ? ` +${vendor.products.length - 3} more`
                          : ""}
                      </p>
                    )}
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

                    <div className="grid grid-cols-2 gap-2 pt-3">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onPlaceOrder(vendor);
                        }}
                        className="w-full col-span-2 text-xs px-3 py-2 border border-blue-600 text-blue-600 rounded-full font-medium hover:bg-blue-600 hover:text-white transition"
                      >
                        Place Order
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onEdit(vendor);
                        }}
                        className="w-full text-xs px-3 py-2 border border-blue-600 text-blue-600 rounded-full font-medium hover:bg-blue-600 hover:text-white transition"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onDelete(vendor);
                        }}
                        disabled={deletingVendorId === vendor._id}
                        className={`w-full text-xs px-3 py-2 border rounded-full font-medium transition ${
                          deletingVendorId === vendor._id
                            ? "border-gray-300 text-gray-400 cursor-not-allowed"
                            : "border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                        }`}
                      >
                        {deletingVendorId === vendor._id ? "Deleting..." : "Delete"}
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