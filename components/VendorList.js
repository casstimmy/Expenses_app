export default function VendorList({
  vendors,
  setSelectedVendor,
  setForm,
  setEditingVendor,
  setShowVendorForm,
  staff,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full">
      {vendors.length ? (
        vendors.map((vendor, idx) => (
          <div
            key={idx}
            className="group p-4 sm:p-5 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg transition-all cursor-pointer hover:bg-gradient-to-br from-blue-50 to-blue-100"
            onClick={() => {
              setSelectedVendor(vendor);
              setForm((prev) => ({
                date: prev.date || new Date().toISOString().split("T")[0],
                supplier: vendor.companyName,
                contact: vendor.repPhone,
                mainProduct: vendor.mainProduct,
                location: staff?.location || "",
                products: vendor.products.map((p) => ({
                  ...p.product,
                  costPerUnit: p.price || 0,
                  qty: 1,
                })),
              }));
            }}
          >
            <div className="mb-4 space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-gray-800 group-hover:text-blue-800 transition truncate">
                {vendor.companyName}
              </h3>
              <p className="text-sm text-gray-600 group-hover:text-blue-700 truncate">
                {vendor.vendorRep}
              </p>
              <p className="text-xs text-gray-400 italic group-hover:text-blue-500 truncate">
                {vendor.mainProduct}
              </p>
            </div>

            <div className="text-right">
              <button
                className="text-xs px-3 py-1 border border-blue-600 text-blue-600 rounded-full font-medium hover:bg-blue-600 hover:text-white transition"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingVendor(vendor);
                  setShowVendorForm(true);
                }}
              >
                Edit
              </button>
            </div>
          </div>
        ))
      ) : (
        <p className="text-gray-500 col-span-full text-center py-8 text-sm">
          No vendors available.
        </p>
      )}
    </div>
  );
}
