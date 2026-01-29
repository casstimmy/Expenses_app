import { Printer } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/router";
import { FaFilePdf, FaWhatsapp, FaTrash } from "react-icons/fa";

export default function OrderTracker({
  order,
  onDeleteOrder,
  editingIndex,
  setEditingIndex,
  setOrder,
  staff,
}) {
  const printRef = useRef();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [fullStaff, setFullStaff] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);

  console.log("Order in Order Tracker: ", order);
  useEffect(() => {
    async function fetchStaffDetails() {
      if (staff && typeof staff === "string") {
        try {
          const res = await fetch(`/api/staff/${staff}`);
          if (!res.ok) throw new Error("Failed to fetch staff");

          const data = await res.json();
          setFullStaff(data);
        } catch (err) {
          console.error("Error fetching staff:", err);
        }
      } else {
        setFullStaff(staff); // Already full object
      }
    }

    fetchStaffDetails();
  }, [staff]);

  useEffect(() => {
    async function enrichProducts() {
      const updated = { ...order };

      for (let i = 0; i < updated.products.length; i++) {
        const p = updated.products[i];

        // Check for ObjectId reference (product._id or product is a string)
        const id = typeof p.product === "string" ? p.product : p?._id;

        if (id) {
          try {
            const res = await fetch(`/api/products/${id}`);
            if (res.ok) {
              const data = await res.json();
              updated.products[i].name = data.name;
              updated.products[i].price = data.costPrice;
            } else {
              console.warn(
                `Failed to fetch product ${id}. Status: ${res.status}`
              );
            }
          } catch (err) {
            console.error("Failed to fetch product", err);
          }
        } else {
          console.warn(`No valid productId for product at index ${i}:`, p);
        }
      }

      setOrder(updated);
    }

    enrichProducts();
  }, []);

  if (!order) return null;

  // WhatsApp Text Builder
  const handleWhatsApp = () => {
    const text =
      `*Stock Order: ${order.supplier}*\n` +
      order.products
        .map(
          (item) =>
            `• ${item.name} - Qty: ${item.quantity}, ₦${item.price} = ₦${item.total}`
        )
        .join("\n") +
      `\n\nTotal: ₦${parseFloat(order.grandTotal).toLocaleString()}`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  // PDF Download

  {
    /**handle Order Pdf Download */
  }
  const handleDownloadPDF = () => {
    try {
      if (!order || !order._id) {
        throw new Error("Order is not available yet.");
      }

      const pdfUrl = `/memo/order?id=${order._id}`;
      window.open(pdfUrl, "_blank");
    } catch (err) {
      console.error("PDF Download Error:", err.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete the entire order?")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/stock-orders/${order._id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        alert("Delete failed: " + (error.error || "Unknown error"));
        return;
      }

      // Wait for DB deletion confirmation
      await res.json(); // If API returns some success message
      alert("Order deleted successfully.");
      onDeleteOrder(order._id);
    } catch (err) {
      console.error("Delete failed:", err);
      alert("An error occurred while deleting the order.");
    } finally {
      setLoading(false);
    }
  };

  // Print Order
  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Order</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { border-collapse: collapse; width: 100%; margin-top: 16px; }
            th, td { border: 1px solid #ccc; padding: 8px; font-size: 14px; }
            th { background-color: #f0f0f0; text-align: left; }
            .total { text-align: right; font-weight: bold; color: #1d4ed8; margin-top: 30px; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Save Order
  const handleSaveOrder = async () => {
    if (!order || !order.products?.length) {
      return alert("Order is missing products.");
    }

    try {
      setSaving(true);

      const payload = {
        ...order,
        reason: "Stock Received",
        products: order.products.map((p) => ({
          name: p.name,
          quantity: Number(p.quantity),
          price: Number(p.price),
          total: Number(p.total),
        })),
        staff: staff,
      };

      const res = await fetch("/api/stock-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const result = await res.json();
        return alert("Failed to save order: " + result.error);
      }

      // Delete original order
      const deleteRes = await fetch(`/api/stock-orders/${order._id}`, {
        method: "DELETE",
      });

      if (!deleteRes.ok) {
        const error = await deleteRes.json();
        return alert("Saved, but failed to delete old order: " + error.error);
      }

      alert("Stock received and order entry removed.");
      router.push("/expenses/Pay_Tracker");
    } catch (err) {
      console.error("Save order error:", err);
      alert("Unexpected error while saving the order.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Order Details */}
      <div
        ref={printRef}
        className="mt-6 bg-white px-4 py-6 sm:p-6 rounded-md shadow-md text-sm sm:text-base"
      >
     <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200 mb-3">
  <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
    Order Details for: <span className="text-blue-600">{order.supplier}</span>
  </h3>

  <button
    onClick={async () => {
      if (!order?.products?.length)
        return alert("No products to check.");

      const updated = {
        ...order,
        products: order.products.filter(
          (p) => Number(p.quantity) !== 0
        ),
      };
      updated.grandTotal = updated.products.reduce(
        (sum, p) => sum + (p.total || 0),
        0
      );

      try {
        setSaving(true);
        const res = await fetch(`/api/stock-orders/${order._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
        });

        if (!res.ok) throw new Error("Failed to update order");
        setOrder(updated);
        alert("Removed zero quantity items and updated order.");
      } catch (err) {
        console.error(err);
        alert("Error updating order");
      } finally {
        setSaving(false);
      }
    }}
    className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg shadow-md 
               bg-gradient-to-r from-yellow-400 to-yellow-500 text-white
               hover:from-yellow-500 hover:to-yellow-600 
               focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 
               transition-all duration-300"
  >
    🧹 Remove Zero Qty
  </button>
</div>


        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-gray-700 mb-6">
          <p>
            <strong>Date:</strong>{" "}
            {order.date
              ? new Date(order.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "—"}
          </p>
          <p>
            <strong>Supplier:</strong> {order.supplier}
          </p>
          <p>
            <strong>Contact:</strong> {order.contact}
          </p>
          <p>
            <strong>Location:</strong> {order.location || "N/A"}
          </p>
        </div>

        {/* Product Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="px-3 py-2 border text-left">Product</th>
                <th className="px-3 py-2 border text-right">Qty</th>
                <th className="px-3 py-2 border text-right">Unit Cost</th>
                <th className="px-3 py-2 border text-right">Total</th>
                {fullStaff?.role === "admin" && (
                  <th className="px-3 py-2 border text-center">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {order.products.map((item, i) => (
                <tr key={i} className="border-t">
                  <td className="px-3 py-2 border">
                    {editingIndex === i ? (
                      <input
                        value={item.name}
                        onChange={(e) => {
                          const updated = { ...order };
                          updated.products[i].name = e.target.value;
                          setOrder(updated);
                        }}
                        className="border px-2 py-1 rounded w-full"
                      />
                    ) : (
                      item.name
                    )}
                  </td>

                  <td className="px-3 py-2 text-right border">
                    {editingIndex === i ? (
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const updated = { ...order };
                          const quantity = parseFloat(e.target.value) || 0;
                          const unit =
                            parseFloat(updated.products[i].price) || 0;
                          updated.products[i].quantity = quantity;
                          updated.products[i].total = quantity * unit;
                          updated.grandTotal = updated.products.reduce(
                            (sum, p) => sum + (p.total || 0),
                            0
                          );
                          setOrder(updated);
                        }}
                        className="border px-2 py-1 rounded w-20 text-right"
                      />
                    ) : (
                      item.quantity
                    )}
                  </td>
                  <td className="px-3 py-2 text-right border">
                    {editingIndex === i ? (
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => {
                          const updated = { ...order };
                          const unit = parseFloat(e.target.value) || 0;
                          const quantity =
                            parseFloat(updated.products[i].quantity) || 0;
                          updated.products[i].price = unit;
                          updated.products[i].total = quantity * unit;
                          updated.grandTotal = updated.products.reduce(
                            (sum, p) => sum + (p.total || 0),
                            0
                          );
                          setOrder(updated);
                        }}
                        className="border px-2 py-1 rounded w-24 text-right"
                      />
                    ) : (
                      `₦${item.product?.costPrice || item.price}`
                    )}
                  </td>

                  <td className="px-3 py-2 text-right border">
                    ₦{parseFloat(item.total)}
                  </td>
                  {fullStaff?.role === "admin" && (
                    <td className="px-3 py-2 text-center border">
                      <div className="flex gap-2 justify-center">
                        {editingIndex === i ? (
                          <>
                            <button
                              onClick={async () => {
                                setSaving(true);
                                try {
                                  const res = await fetch(
                                    `/api/stock-orders/${order._id}`,
                                    {
                                      method: "PUT",
                                      headers: {
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify(order),
                                    }
                                  );

                                  if (!res.ok)
                                    throw new Error("Failed to save");

                                  setEditingIndex(null);
                                } catch (err) {
                                  console.error("Error saving:", err);
                                  alert("Failed to save. Try again.");
                                } finally {
                                  setSaving(false);
                                }
                              }}
                              disabled={saving}
                              className={`${
                                saving
                                  ? "opacity-50 cursor-not-allowed"
                                  : "hover:text-white hover:bg-green-500"
                              } text-green-600 border border-green-500 px-3 py-1 rounded text-sm`}
                            >
                              {saving ? "Saving..." : "Save"}
                            </button>
                            <button
                              onClick={() => setEditingIndex(null)}
                              className="text-gray-600 hover:text-white border border-gray-400 hover:bg-gray-400 px-3 py-1 rounded text-sm"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingIndex(i)}
                              className="text-blue-600 hover:text-white border border-blue-500 hover:bg-blue-500 px-3 py-1 rounded text-sm"
                            >
                              Edit
                            </button>
                      
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Save + Total */}
        <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4 border-t pt-6">
          <button
            onClick={() => setShowReceiveModal(true)}
            className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm"
            disabled={saving}
          >
            {saving ? "Saving..." : "Received Order"}
          </button>
          <div className="text-lg font-semibold text-blue-800">
            T-Total: ₦{parseFloat(order.grandTotal).toLocaleString()}
          </div>
        </div>

        {/* Receive Order Confirmation Modal */}
        {showReceiveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-bold mb-2 text-gray-800">Confirm Stock Receipt</h3>
              <p className="mb-4 text-gray-700">
                You are about to receive this stock into the store. This will remove the order entry and redirect you to the Pay Tracker page.
                <br />
                Are you sure you want to continue?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                  onClick={() => setShowReceiveModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
                  onClick={async () => {
                    setShowReceiveModal(false);
                    await handleSaveOrder();
                  }}
                  disabled={saving}
                >
                  Yes, Receive & Remove
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4 print:hidden">
        <button
          onClick={handleWhatsApp}
          className="flex items-center gap-2 px-4 py-2 border border-green-500 text-green-600 rounded hover:bg-green-600 hover:text-white"
        >
          <FaWhatsapp /> WhatsApp
        </button>
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 px-4 py-2 border border-gray-500 text-gray-700 rounded hover:bg-gray-600 hover:text-white"
        >
          <FaFilePdf /> PDF
        </button>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 border border-blue-500 text-blue-700 rounded hover:bg-blue-700 hover:text-white"
        >
          <Printer /> Print
        </button>
        {fullStaff?.role === "admin" && onDeleteOrder && (
          <button
            onClick={handleDelete}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 border border-red-500 rounded transition-all duration-200
        ${
          loading
            ? "bg-red-300 text-white cursor-not-allowed"
            : "text-red-600 hover:bg-red-600 hover:text-white"
        }
      `}
          >
            <FaTrash />
            {loading ? "Deleting..." : "Delete Order"}
          </button>
        )}
      </div>
    </>
  );
}
