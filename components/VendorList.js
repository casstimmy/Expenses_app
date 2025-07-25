import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function VendorList({
  vendors,
  setSelectedVendor,
  setForm,
  setEditingVendor,
  setShowVendorForm,
  staff,
}) {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const handleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handlePlaceOrder = (vendor) => {
    setSelectedVendor(vendor);
    setForm((prev) => ({
      date: prev.date || new Date().toISOString().split("T")[0],
      supplier: vendor.companyName,
      contact: vendor.repPhone,
      mainProduct: vendor.mainProduct,
      location: staff?.location || "",
      products: vendor.products.map((p) => ({
        ...p.product,
        costPrice: p.price || 0,
        quantity: 1,
      })),
    }));
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
      {vendors.length ? (
        vendors.map((vendor, idx) => {
          const isExpanded = expandedIndex === idx;

          return (
            <motion.div
              key={idx}
              layout
              onClick={() => handleExpand(idx)}
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
                    isExpanded
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-500 group-hover:bg-green-100 group-hover:text-green-600"
                  }`}
                >
                  {isExpanded ? "Expanded" : "Open"}
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
                    <p><strong>Rep:</strong> {vendor.vendorRep}</p>
                    <p><strong>Phone:</strong> {vendor.repPhone}</p>
                    <p><strong>Main Product:</strong> {vendor.mainProduct}</p>
                    <p><strong>Location:</strong> {staff?.location || "N/A"}</p>
                    <p><strong>Product Count:</strong> {vendor.products.length}</p>

                    <div className="flex space-x-2 pt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlaceOrder(vendor);
                        }}
                        className="text-xs px-3 py-1 border border-green-600 text-green-600 rounded-full font-medium hover:bg-green-600 hover:text-white transition"
                      >
                        Place Order
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingVendor(vendor);
                          setShowVendorForm(true);
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
          No vendors available.
        </p>
      )}
    </div>
  );
}
