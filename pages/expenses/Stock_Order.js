import VendorForm from "@/components/VendorForm";
import OrderForm from "@/components/OrderForm";
import VendorList from "@/components/VendorList";
import OrderList from "@/components/OrderList";
import Layout from "@/components/Layout";
import { useEffect, useState, useRef } from "react";

const getToday = () => new Date().toISOString().split("T")[0];

export default function StockOrder() {
  const orderFormRef = useRef(null);
  const [orders, setOrders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [submittedOrders, setSubmittedOrders] = useState([]);
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [merging, setMerging] = useState(false);
  const [staff, setStaff] = useState(null);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingSubmittedOrders, setLoadingSubmittedOrders] = useState(false);

  const [form, setForm] = useState({
    date: getToday(),
    supplier: "",
    contact: "",
    mainProduct: "",
    products: [],
    location: "",
  });

  useEffect(() => {
    const initialize = async () => {
      const stored = localStorage.getItem("staff");
      if (stored) {
        const parsedStaff = JSON.parse(stored);
        setStaff(parsedStaff);
        if (parsedStaff.location) {
          setForm((prev) => ({ ...prev, location: parsedStaff.location }));
        }
      }
      await loadVendors();
      await loadSubmittedOrders();
    };

    initialize();
  }, []);

  const loadVendors = async () => {
    setLoadingVendors(true);
    try {
      const res = await fetch("/api/vendors");
      const data = await res.json();
      setVendors(data);
    } catch (err) {
      console.error("Failed to load vendors:", err);
    } finally {
      setLoadingVendors(false);
    }
  };

  const loadSubmittedOrders = async () => {
    setLoadingSubmittedOrders(true);
    try {
      const res = await fetch("/api/stock-orders");
      const data = await res.json();
      setSubmittedOrders(data);
    } catch (err) {
      console.error("Failed to load submitted orders:", err);
    } finally {
      setLoadingSubmittedOrders(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedOrders = form.products.map((prod) => ({
      date: form.date,
      supplier: selectedVendor?.companyName,
      contact: form.contact,
      mainProduct: selectedVendor?.mainProduct || "",
      product: prod.name,
      quantity: prod.qty,
      costPerUnit: prod.costPerUnit || 0,
      total: prod.qty * (prod.costPerUnit || 0),
      location: form.location,
    }));

    setOrders([...orders, ...updatedOrders]);

    setForm({
      date: getToday(),
      supplier: "",
      contact: "",
      mainProduct: "",
      products: [],
      location: staff?.location || "",
    });
    setSelectedVendor(null);
  };

  const handleStockOrderSubmit = async () => {
    setSubmitting(true);

    const payload = {
      date: orders[0].date,
      supplier: orders[0].supplier,
      contact: orders[0].contact,
      location: orders[0].location,
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
        loadSubmittedOrders();
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to submit order.");
    } finally {
      setSubmitting(false);
    }
  };

  const mergeOrders = async () => {
    setMerging(true);
    try {
      const res = await fetch("/api/stock-orders/merge", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        alert(`Merged ${data.mergedCount} grouped orders!`);
        loadSubmittedOrders();
      } else {
        alert("Merge failed");
      }
    } catch (err) {
      console.error(err);
      alert("Merge request failed.");
    }
    setMerging(false);
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

          {/* Vendor Section */}
          <section className="bg-white p-6 rounded shadow relative">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Vendors</h2>
              <button
                onClick={() => setShowVendorForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
              >
                + Add Vendor
              </button>
            </div>
            {/* Vendor Section */}
            <div className="relative">
              {loadingVendors && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10">
                  <div className="w-10 h-10 border-4 border-white border-t-blue-600 rounded-full animate-spin" />
                </div>
              )}

              <VendorList
                vendors={vendors}
                setSelectedVendor={(vendor) => {
                  setSelectedVendor(vendor);
                  setTimeout(() => {
                    orderFormRef.current?.scrollIntoView({
                      behavior: "smooth",
                    });
                  }, 100);
                }}
                setForm={setForm}
                setEditingVendor={setEditingVendor}
                setShowVendorForm={setShowVendorForm}
                staff={staff}
              />
            </div>
          </section>

          {/* Vendor Modal */}
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

          {/* Order Form */}
          {selectedVendor && (
            <form
              ref={orderFormRef}
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

                  <div className="flex justify-between w-full text-right font-medium pt-2">
                    <div>T-Total</div>
                    <div className="font-semibold text-blue-700">
                      ₦
                      {form.products
                        .reduce(
                          (sum, item) =>
                            sum + (item.qty || 0) * (item.costPerUnit || 0),
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

          {/* Order Review */}
         {orders.length > 0 && (
  <section className="bg-white p-6 rounded-xl shadow-lg space-y-6">
    <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Stock Order Summary</h2>

    <div className="overflow-x-auto">
      <table className="min-w-full text-sm text-left border border-gray-200">
        <thead className="bg-blue-50 text-gray-700 uppercase tracking-wide">
          <tr>
            <th className="px-4 py-2 border">#</th>
            <th className="px-4 py-2 border">Product Name</th>
            <th className="px-4 py-2 border">Quantity</th>
            <th className="px-4 py-2 border">Unit Price (₦)</th>
            <th className="px-4 py-2 border">Total (₦)</th>
          </tr>
        </thead>
        <tbody className="text-gray-800">
          {orders.map((item, index) => (

            <tr key={index} className="hover:bg-gray-50 transition-all">
              <td className="px-4 py-2 border">{index + 1}</td>
              <td className="px-4 py-2 border">{item.product}</td>
              <td className="px-4 py-2 border">{item.quantity}</td>
              <td className="px-4 py-2 border">
                {parseFloat(item.costPerUnit).toLocaleString()}
              </td>
              <td className="px-4 py-2 border font-semibold">
                {parseFloat(item.total).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-blue-100 text-blue-800 font-bold">
            <td colSpan="4" className="px-4 py-2 text-right border">
              T-Total:
            </td>
            <td className="px-4 py-2 border">
              ₦
              {orders
                .reduce((sum, o) => sum + parseFloat(o.total), 0)
                .toLocaleString()}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

    <div className="text-right">
      <button
  onClick={handleStockOrderSubmit}
  className="bg-green-600 text-white px-6 py-3 rounded-lg shadow hover:bg-green-700 transition-all"
  disabled={submitting}
>
  {submitting ? "Processing Order..." : "✅ Submit Order"}
</button>

    </div>
  </section>
)}


          {staff?.role === "admin" && (
            <div className="text-right mt-4">
              <button
                onClick={mergeOrders}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                disabled={merging}
              >
                {merging ? "Merging Orders..." : "🧩 Merge Same-Day Orders"}
              </button>
            </div>
          )}

          {/* Order Section */}
          <div className="relative">
            {loadingSubmittedOrders && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10">
                <div className="w-10 h-10 border-4 border-white border-t-blue-600 rounded-full animate-spin" />
              </div>
            )}

            <OrderList
              submittedOrders={(staff?.role === "admin"
                ? submittedOrders
                : submittedOrders.filter(
                    (order) =>
                      order.location === staff?.location ||
                      order.location === "All Locations (Merged)"
                  )
              ).filter((order) => !order.reason)}
              selectedOrder={selectedOrder}
              setSelectedOrder={setSelectedOrder}
              staff={staff}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
