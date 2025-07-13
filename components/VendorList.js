

export default function VendorList({ vendors, setSelectedVendor, setForm, setEditingVendor, setShowVendorForm }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {vendors.length ? (
        vendors.map((vendor, idx) => (
          <div
            key={idx}
            className="group p-5 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg transition-all cursor-pointer hover:bg-gradient-to-br from-blue-50 to-blue-100"
            onClick={() => {
              setSelectedVendor(vendor);
              setForm({
                date: "",
                supplier: vendor.companyName,
                contact: vendor.repPhone,
                mainProduct: vendor.mainProduct,
                products: vendor.products.map((p) => ({
                  ...p.product,
                  costPerUnit: p.price || 0,
                  qty: 1,
                })),
              });
            }}
          >
            <div className="mb-4 space-y-1">
              <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-800 transition">
                {vendor.companyName}
              </h3>
              <p className="text-sm text-gray-600 group-hover:text-blue-700">{vendor.vendorRep}</p>
              <p className="text-xs text-gray-400 italic group-hover:text-blue-500">
                {vendor.mainProduct}
              </p>
            </div>

            <div className="text-right">
              <button
                className="text-xs px-4 py-1 border border-blue-600 text-blue-600 rounded-full font-medium hover:bg-blue-600 hover:text-white transition"
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
        <p className="text-gray-500 col-span-full text-center py-8 text-sm">No vendors available.</p>
      )}
    </div>
  );
}
