import Layout from "@/components/Layout";
import VendorForm from "@/components/VendorForm";
import StockOrderTable from "@/components/OrderTracker";
import { useEffect, useState } from "react";
import OrderForm from "@/components/OrderForm";
import VendorList from "@/components/VendorList";
import OrderList from "@/components/OrderList";

export default function StockOrder() {
  const [orders, setOrders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [submittedOrders, setSubmittedOrders] = useState([]);
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [form, setForm] = useState({
    date: "",
    supplier: "",
    contact: "",
    products: [],
  });

  useEffect(() => {
    fetch("/api/stock-orders")
      .then((res) => res.json())
      .then((data) => setSubmittedOrders(data))
      .catch((err) => console.error("Failed to fetch submitted orders", err));
  }, []);

  useEffect(() => {
    fetch("/api/vendors")
      .then((res) => res.json())
      .then((data) => setVendors(data))
      .catch((err) => console.error("Failed to load vendors:", err));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedOrders = form.products.map((prod) => ({
      date: form.date,
      supplier: form.supplier,
      contact: form.contact,
      product: prod.name,
      quantity: prod.qty,
      costPerUnit: prod.costPerUnit || 0,
      total: prod.qty * (prod.costPerUnit || 0),
    }));
    setOrders([...updatedOrders, ...orders]);
    setForm({ date: "", supplier: "", contact: "", products: [] });
    setSelectedVendor(null);

    {
      console.log("Sending payload", updatedOrders);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold text-blue-800">Stock Ordering</h1>

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
              setEditingVendor={setEditingVendor} // ✅ Add this
              setShowVendorForm={setShowVendorForm} // ✅ Add this
            />
          </section>

          {showVendorForm && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-xl p-6 relative">
                <div className="flex justify-between items-center border-b pb-2 mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Add Vendor
                  </h2>
                  <button
                    className="text-gray-600 hover:text-red-500 text-xl"
                    onClick={() => setShowVendorForm(false)}
                  >
                    &times;
                  </button>
                </div>
                <VendorForm
                  editingVendor={editingVendor}
                  onSuccess={() => {
                    setShowVendorForm(false);
                    setEditingVendor(null);
                    fetch("/api/vendors")
                      .then((res) => res.json())
                      .then((data) => setVendors(data));
                  }}
                />
              </div>
            </div>
          )}

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
                    <span className="font-semibold text-gray-900">
                      Company:
                    </span>{" "}
                    {selectedVendor?.companyName}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-900">
                      Representative:
                    </span>{" "}
                    {selectedVendor?.vendorRep}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-900">Phone:</span>{" "}
                    {selectedVendor?.repPhone}
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
                  {form.products.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-700">
                          Products
                        </h2>
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                "Are you sure you want to clear the entire form?"
                              )
                            ) {
                              setForm({
                                date: "",
                                supplier: "",
                                contact: "",
                                mainProduct: "",
                                products: [],
                              });
                            }
                          }}
                          className="inline-flex items-center gap-1 text-sm font-medium text-red-600 bg-red-100 hover:bg-red-200 px-3 py-1 rounded transition"
                        >
                          <span className="text-lg leading-none">&times;</span>
                          Clear All
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
                    </div>
                  )}
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
                  {orders.map((order, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-4 py-2">{order.product}</td>
                      <td className="px-4 py-2 text-right">{order.quantity}</td>
                      <td className="px-4 py-2 text-right">
                        ₦{parseFloat(order.costPerUnit).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-right">
                        ₦{parseFloat(order.total).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => {
                            const updated = [...orders];
                            updated.splice(idx, 1);
                            setOrders(updated);
                          }}
                          className="text-red-500 hover:underline text-xs"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-right font-semibold text-blue-700">
                Grand Total: ₦
                {orders
                  .reduce((sum, o) => sum + parseFloat(o.total), 0)
                  .toLocaleString()}
              </div>
              <div className="text-right">
                <button
                  onClick={async () => {
                    const payload = {
                      date: orders[0].date,
                      supplier: orders[0].supplier,
                      contact: orders[0].contact,
                      mainProduct: selectedVendor?.mainProduct || "",
                      products: orders.map((o) => ({
                        product: o.product,
                        quantity: o.quantity,
                        costPerUnit: o.costPerUnit,
                        total: o.total,
                      })),
                      grandTotal: orders.reduce(
                        (sum, o) => sum + parseFloat(o.total),
                        0
                      ),
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
                      } else {
                        alert("Error: " + data.error);
                      }
                    } catch (err) {
                      console.error(err);
                      alert("Failed to submit order.");
                    }
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Submit Order
                </button>
              </div>
            </section>
          )}

          <OrderList
            submittedOrders={submittedOrders}
            selectedOrder={selectedOrder}
            setSelectedOrder={setSelectedOrder}
          />
        </div>
      </div>
    </Layout>
  );
}
