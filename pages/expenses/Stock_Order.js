import Layout from "@/components/Layout";
import VendorForm from "@/components/VendorForm";
import StockOrderTable from "@/components/OrderTracker";
import { useEffect, useState } from "react";
import OrderForm from "@/components/OrderForm";
import VendorList from "@/components/VendorList";
import OrderList from "@/components/OrderList";
import { FaEdit, FaTrash  } from "react-icons/fa";

const getToday = () => new Date().toISOString().split("T")[0];

export default function StockOrder() {
  const [orders, setOrders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [submittedOrders, setSubmittedOrders] = useState([]);
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [staff, setStaff] = useState(null);
  const [form, setForm] = useState({
    date: getToday(),
  supplier: "",
  contact: "",
  mainProduct: "",
  products: [],
  location: staff?.location || "", // ✅ include location here
  });


  const handleDeleteOrder = (deletedOrderId) => {
  setOrders((prev) => prev.filter((o) => o._id !== deletedOrderId));
  setSelectedOrder(null);
};


  // 🔄 Load vendors and stock orders
  const loadVendors = async () => {
    try {
      const res = await fetch("/api/vendors");
      const data = await res.json();
      setVendors(data);
    } catch (err) {
      console.error("Failed to load vendors:", err);
    }
  };

  const loadSubmittedOrders = async () => {
    try {
      const res = await fetch("/api/stock-orders");
      const data = await res.json();
      setSubmittedOrders(data);
    } catch (err) {
      console.error("Failed to fetch submitted orders", err);
    }
  };

  const loadStaff = () => {
    const stored = localStorage.getItem("staff");
    if (stored) {
      setStaff(JSON.parse(stored));
    }
  };

  useEffect(() => {
    loadStaff();
    loadVendors();
    loadSubmittedOrders();
  }, []);

  useEffect(() => {
    if (staff?.location) {
      setForm((prev) => ({
        ...prev,
        location: staff.location,
      }));
    }
  }, [staff]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.location && staff?.location) {
  setForm((prev) => ({ ...prev, location: staff.location }));
}



   const updatedOrders = form.products.map((prod) => ({
  date: form.date,
  supplier: form.supplier,
  contact: form.contact,
  mainProduct: form.mainProduct,
  product: prod.name,
  quantity: prod.qty,
  costPerUnit: prod.costPerUnit || 0,
  total: prod.qty * (prod.costPerUnit || 0),
  location: form.location, // ✅ This must exist
}));


    setOrders([...updatedOrders, ...orders]);

    setForm({
       date: getToday(),
  supplier: "",
  contact: "",
  mainProduct: "",
  products: [],
  location: staff?.location || "", // ✅ include location here
    });

    setSelectedVendor(null);
  };

  const handleStockOrderSubmit = async () => {



  const payload = {
  date: orders[0].date,
  supplier: orders[0].supplier,
  contact: orders[0].contact,
  location: orders[0].location, // ✅ this works if orders were built with it
  mainProduct: orders[0].mainProduct || "",
  products: orders.map((o) => ({
    product: o.product,
    quantity: o.quantity,
    costPerUnit: o.costPerUnit,
    total: o.total,
  })),
  grandTotal: orders.reduce((sum, o) => sum + parseFloat(o.total), 0),
};
    try {
      const res = await fetch("/api/stock-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Stock order submitted successfully!");
        setOrders([]);
        loadSubmittedOrders(); // 🔄 Refresh table
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to submit order.");
    }

  };

  // After handleStockOrderSubmit
const mergeOrders = async () => {
  const res = await fetch("/api/stock-orders/merge", {
    method: "POST",
  });
  const data = await res.json();
  if (data.success) {
    alert(`Merged ${data.mergedCount} grouped orders!`);
    loadSubmittedOrders(); // Refresh the list after merging
  } else {
    alert("Merge failed");
  }
};



  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold text-blue-800 mb-6">
            Stock Ordering
          </h1>
          {staff && (
            <div className="mb-6 px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-900">
              <p className="font-medium">
                Logged in as{" "}
                <span className="text-blue-800 font-bold">{staff?.name}</span>{" "}
                &nbsp;|&nbsp; Location:{" "}
                <span className="text-blue-800 font-bold">
                  {staff?.location}
                </span>
              </p>
            </div>
          )}

          {/* ✅ Vendor Section */}
          <section className="bg-white p-6 rounded shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Vendors</h2>
              <button
                onClick={() => setShowVendorForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
              >
                + Add Vendor
              </button>
            </div>

           <VendorList
  vendors={vendors}
  setSelectedVendor={setSelectedVendor}
  setForm={setForm}
  setEditingVendor={setEditingVendor}
  setShowVendorForm={setShowVendorForm}
  staff={staff}
/>

          </section>

          {/* ✅ Vendor Modal */}
          {showVendorForm && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-xl p-6 relative">
                <div className="flex justify-between items-center border-b pb-2 mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {editingVendor ? "Edit Vendor" : "Add Vendor"}
                  </h2>
                  <button
                    className="text-gray-600 hover:text-red-500 text-xl"
                    onClick={() => {
                      setShowVendorForm(false);
                      setEditingVendor(null);
                    }}
                  >
                    &times;
                  </button>
                </div>
                <VendorForm
                  editingVendor={editingVendor}
                  onSuccess={() => {
                    setShowVendorForm(false);
                    setEditingVendor(null);
                    loadVendors();
                  }}
                />
              </div>
            </div>
          )}

          {/* ✅ Order Form */}
          {selectedVendor && (
            <form
              onSubmit={handleSubmit}
              className="bg-white p-6 rounded shadow space-y-6"
            >
              <div className="mb-6 p-5 rounded-xl shadow-md border border-gray-200 bg-gradient-to-r from-blue-50 to-white">
                <div className="flex items-center justify-between px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl shadow-sm mb-4">
                  <h2 className="text-lg sm:text-xl font-bold text-blue-900 flex items-center gap-2">
                    <span className="text-2xl">📦</span>
                    Vendor Order:{" "}
                    <span className="text-blue-700 font-semibold">
                      {selectedVendor?.mainProduct || "N/A"}
                    </span>
                  </h2>
                  <span className="text-xs sm:text-sm font-medium text-blue-700 bg-blue-100 border border-blue-300 px-3 py-1 rounded-full shadow-sm">
                    📝 Order Mode
                  </span>
                </div>
                <div className="mt-3 text-sm text-gray-700 space-y-1">
                  <p>
                    <strong>Company:</strong> {selectedVendor?.companyName}
                  </p>
                  <p>
                    <strong>Representative:</strong> {selectedVendor?.vendorRep}
                  </p>
                  <p>
                    <strong>Phone:</strong> {selectedVendor?.repPhone}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  className="border p-2 rounded"
                  required
                />
                <input
                  type="text"
                  name="supplier"
                  value={form.supplier}
                  onChange={handleChange}
                  placeholder="Supplier"
                  className="border p-2 rounded"
                  required
                />
                <input
                  type="text"
                  name="contact"
                  value={form.contact}
                  onChange={handleChange}
                  placeholder="Contact"
                  className="border p-2 rounded"
                />
              </div>

              {form.products.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-700">
                      Products
                    </h2>
                    <button
                      onClick={() => {
                        if (confirm("Clear the entire form?")) {
                          setForm({
                            date: getToday(),
  supplier: "",
  contact: "",
  mainProduct: "",
  products: [],
  location: staff?.location || "",
                          });
                        }
                      }}
                      className="text-sm text-red-600 bg-red-100 hover:bg-red-200 px-3 py-1 rounded"
                    >
                      × Clear All
                    </button>
                  </div>

                  {form.products.map((product, index) => (
                    <OrderForm
                      key={index}
                      index={index}
                      product={product}
                      form={form}
                      setForm={setForm}
                    />
                  ))}

                     {/* T-Total */}
      <div className="flex justify-between w-full text-right font-medium pt-2">
       <div>T-Total</div>
<div className="font-semibold text-blue-700">
  ₦
  {form.products
    .reduce(
      (sum, item) => sum + (item.qty || 0) * (item.costPerUnit || 0),
      0
    )
    .toLocaleString()}
</div>

      </div>
                </div>
                
              )}

              <div className="text-right">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Add Order
                </button>
              </div>
            </form>
          )}

          {/* ✅ Order Review */}
          {orders.length > 0 && (
            <section className="bg-white p-6 rounded shadow space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <p>
                  <strong>Date:</strong> {orders[0].date}
                </p>
                <p>
                  <strong>Supplier:</strong> {orders[0].supplier}
                </p>
                <p>
                  <strong>Contact:</strong> {orders[0].contact}
                </p>
              </div>
              <table className="w-full text-sm bg-gray-50">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left">Product</th>
                    <th className="px-4 py-2 text-right">Qty</th>
                    <th className="px-4 py-2 text-right">Unit Cost</th>
                    <th className="px-4 py-2 text-right">Total</th>
                    <th className="px-4 py-2 text-center">Action</th>
                  </tr>
                </thead>
          <tbody>
  {orders.map((item, i) => (
    <tr key={i} className="border-t">
      <td className="px-3 py-2 border">
        {editingIndex === i ? (
          <input
            value={item.product}
            onChange={(e) => {
              const updated = [...orders];
              updated[i].product = e.target.value;
              setOrders(updated);
            }}
            className="border rounded px-2 py-1 w-full"
          />
        ) : (
          item.product
        )}
      </td>
      <td className="px-3 py-2 text-right border">
        {editingIndex === i ? (
          <input
            type="number"
            value={item.quantity}
            onChange={(e) => {
              const updated = [...orders];
              updated[i].quantity = parseFloat(e.target.value) || 0;
              updated[i].total = updated[i].quantity * (updated[i].costPerUnit || 0);
              setOrders(updated);
            }}
            className="border rounded px-2 py-1 w-20 text-right"
          />
        ) : (
          item.quantity
        )}
      </td>
      <td className="px-3 py-2 text-right border">
        {editingIndex === i ? (
          <input
            type="number"
            value={item.costPerUnit}
            onChange={(e) => {
              const updated = [...orders];
              updated[i].costPerUnit = parseFloat(e.target.value) || 0;
              updated[i].total = updated[i].quantity * updated[i].costPerUnit;
              setOrders(updated);
            }}
            className="border rounded px-2 py-1 w-20 text-right"
          />
        ) : (
          `₦${parseFloat(item.costPerUnit).toLocaleString()}`
        )}
      </td>
      <td className="px-3 py-2 text-right border">
        ₦{parseFloat(item.total).toLocaleString()}
      </td>
      <td className="px-3 py-2 text-center border">
        {editingIndex === i ? (
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setEditingIndex(null)}
              className="text-green-600 hover:underline text-xs"
            >
              Save
            </button>
            <button
              onClick={() => setEditingIndex(null)}
              className="text-gray-600 hover:underline text-xs"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setEditingIndex(i)}
              className="text-yellow-600 hover:text-yellow-800"
              title="Edit"
            >
              <FaEdit />
            </button>
            <button
              onClick={() => {
                if (confirm(`Delete "${item.product}" from order?`)) {
                  const updated = [...orders];
                  updated.splice(i, 1);
                  setOrders(updated);
                }
              }}
              className="text-red-500 hover:text-red-700"
              title="Delete"
            >
              <FaTrash />
            </button>
          </div>
        )}
      </td>
    </tr>
  ))}
</tbody>



              </table>
              <div className="text-right font-semibold text-blue-700">
                T-Total: ₦
                {orders
                  .reduce((sum, o) => sum + parseFloat(o.total), 0)
                  .toLocaleString()}
              </div>
              <div className="text-right">
                <button
                  onClick={handleStockOrderSubmit}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Submit Order
                </button>
              </div>
            </section>
          )}

          <div className="text-right mt-4">
  <button
    onClick={mergeOrders}
    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
  >
    🧩 Merge Same-Day Orders
  </button>
</div>


          {/* ✅ Order Table */}
          <OrderList
            submittedOrders={submittedOrders}
            selectedOrder={selectedOrder}
            setSelectedOrder={setSelectedOrder}
            staff={staff}
          />
        </div>
      </div>
    </Layout>
  );
}
