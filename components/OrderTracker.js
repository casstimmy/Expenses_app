import { Printer } from "lucide-react";
import { useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useRouter } from "next/router";
import { FaFilePdf, FaWhatsapp, FaTrash, FaEdit } from "react-icons/fa";




export default function OrderTracker({
  order,
  onDeleteOrder,
  onDeleteProduct,
  onEditProduct,
  editingIndex,
  setEditingIndex,
  setOrder,
  staff
}) {
  const printRef = useRef();
  if (!order) return null;


  
const [saving, setSaving] = useState(false);
const [reason, setReason] = useState("Received - Confirmed");


  const handleWhatsApp = () => {
    const text =
      `*Stock Order: ${order.supplier}*\n` +
      order.products
        .map(
          (item) =>
            `• ${item.product} - Qty: ${item.quantity}, ₦${item.costPerUnit} = ₦${item.total}`
        )
        .join("\n") +
      `\n\nTotal: ₦${parseFloat(order.grandTotal).toLocaleString()}`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

 const sanitizeColors = (node) => {
  if (typeof window === "undefined") return;
  const all = node.querySelectorAll("*");
  all.forEach((el) => {
    const style = window.getComputedStyle(el);
    if (style.color.includes("oklch")) el.style.color = "black";
    if (style.backgroundColor.includes("oklch"))
      el.style.backgroundColor = "white";
  });
};


 const handleDownloadPDF = async () => {
  if (typeof window === "undefined") return;
    const input = printRef.current;
    if (!input) return;

    try {
      sanitizeColors(input);
      const canvas = await html2canvas(input, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        scrollY: -window.scrollY,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Order-${order.supplier}-${order.date}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF.");
    }
  };

 const handlePrint = () => {
  if (typeof window === "undefined") return;
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

const handleSaveOrder = async () => {
  if (!order || !order.products || order.products.length === 0) {
    return alert("Order is missing products.");
  }

  try {
    setSaving(true);

    const payload = {
      ...order,
      reason: "Stock Received",
    };

    const res = await fetch("/api/stock-orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    setSaving(false);

    if (!res.ok) {
      return alert("Failed to save order: " + result.error);
    }

    // Step 2: Delete the previous order using its ID
    const deleteRes = await fetch(`/api/stock-orders/${order._id}`, {
  method: "DELETE",
});


    if (!deleteRes.ok) {
      const error = await deleteRes.json();
      return alert("Saved, but failed to delete old order: " + error.error);
    }

    alert("Stock received and order entry removed.");
  } catch (error) {
    console.error("Save order error:", error);
    alert("An unexpected error occurred while saving the order.");
  }
 alert("Stock received and order entry removed.");
setTimeout(() => {
  router.push("/expenses/Pay_Tracker");
}, 1000); // 1 second delay

};


const OrderTracker = ({ order }) => {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  if (!order) return null; // ✅ safe now

  // ...rest of your component
};



  return (
    <>
      <div
        ref={printRef}
        className="mt-6 bg-white px-4 py-6 sm:p-6 rounded-md shadow-md text-sm sm:text-base overflow-x-auto"
      >
        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
          Order Details for: {order.supplier}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-gray-700 mb-4">
          <p>
            <strong>Date:</strong> {order.date}
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

        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-200 text-gray-700">
                <th className="px-3 py-2 border text-left">Product</th>
                <th className="px-3 py-2 border text-right">Qty</th>
                <th className="px-3 py-2 border text-right">Unit Cost</th>
                <th className="px-3 py-2 border text-right">Total</th>
                {staff?.role === "admin" && (
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
                        value={item.product}
                        onChange={(e) => {
                          const updated = { ...order };
                          updated.products[i].product = e.target.value;
                          setOrder(updated);
                        }}
                        className="border px-2 py-1 rounded w-full"
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
                          const updated = { ...order };
                          updated.products[i].quantity =
                            parseFloat(e.target.value) || 0;
                          updated.products[i].total =
                            updated.products[i].quantity *
                            updated.products[i].costPerUnit;
                          updated.grandTotal = updated.products.reduce(
                            (sum, p) => sum + p.total,
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
                        value={item.costPerUnit}
                        onChange={(e) => {
                          const updated = { ...order };
                          updated.products[i].costPerUnit =
                            parseFloat(e.target.value) || 0;
                          updated.products[i].total =
                            updated.products[i].quantity *
                            updated.products[i].costPerUnit;
                          updated.grandTotal = updated.products.reduce(
                            (sum, p) => sum + p.total,
                            0
                          );
                          setOrder(updated);
                        }}
                        className="border px-2 py-1 rounded w-24 text-right"
                      />
                    ) : (
                      `₦${parseFloat(item.costPerUnit).toLocaleString()}`
                    )}
                  </td>

                  <td className="px-3 py-2 text-right border">
                    ₦{parseFloat(item.total).toLocaleString()}
                  </td>
                  {staff?.role === "admin" && (
                    <td className="px-3 py-2 text-center border">
                      <div className="flex gap-2 justify-center">
                        {editingIndex === i ? (
                          <>
                            <button
                              onClick={() => setEditingIndex(null)}
                              className="w-20 inline-flex justify-center px-3 py-1.5 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-md shadow-sm transition-all duration-200"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingIndex(null)}
                              className="w-20 inline-flex justify-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-all duration-200"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingIndex(i)}
                              className="w-20 inline-flex justify-center px-3 py-1.5 text-sm font-medium text-blue-600 border border-blue-300 hover:bg-blue-50 rounded-md transition-all duration-200"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                if (
                                  confirm(
                                    `Delete "${item.product}" from order?`
                                  )
                                ) {
                                  const updated = { ...order };
                                  updated.products.splice(i, 1);
                                  updated.grandTotal = updated.products.reduce(
                                    (sum, p) => sum + p.total,
                                    0
                                  );
                                  setOrder(updated);
                                  setEditingIndex(null);
                                }
                              }}
                              className="w-20 inline-flex justify-center px-3 py-1.5 text-sm font-medium text-red-600 border border-red-300 hover:bg-red-50 rounded-md transition-all duration-200"
                            >
                              Delete
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
<div className="mt-8 border-t pt-6">
  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
    {/* Button */}
    <button
      onClick={handleSaveOrder}
      className="flex items-center gap-2 px-5 py-2 rounded-xl border border-green-500 text-green-600 bg-white hover:bg-green-500 hover:text-white transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
    >
      <svg
        className="w-4 h-4 group-hover:stroke-white"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M5 13l4 4L19 7" />
      </svg>
      <span>{saving ? "Saving..." : "Received Order"}</span>
    </button>
   
    {/* Total */}
    <div className="flex items-center text-blue-800 font-semibold text-lg">
      <span className="mr-2">T-Total:</span>
      <span>₦{parseFloat(order.grandTotal).toLocaleString()}</span>
    </div>

   
  </div>
</div>

      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-3 pt-4 print:hidden">
        <button
          onClick={handleWhatsApp}
          className="group flex items-center gap-2 px-4 py-1.5 rounded-lg border border-green-400 bg-white text-green-600 text-sm font-medium hover:bg-green-500 hover:text-white"
        >
          <FaWhatsapp className="w-4 h-4" />
          WhatsApp
        </button>

        <button
          onClick={handleDownloadPDF}
          className="group flex items-center gap-2 px-4 py-1.5 rounded-lg border border-gray-400 bg-white text-gray-700 text-sm font-medium hover:bg-gray-600 hover:text-white"
        >
          <FaFilePdf className="w-4 h-4" />
          PDF
        </button>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-gray-600 border border-gray-400 rounded hover:bg-blue-800 hover:text-white text-sm"
        >
          <Printer className="w-4 h-4" />
          Print
        </button>

        {staff?.role === "admin" && onDeleteOrder && (
          <button
            onClick={async () => {
              if (confirm("Delete entire order?")) {
                const res = await fetch(`/api/stock-orders/${order._id}`, {
                  method: "DELETE",
                });

                if (res.ok) {
                  alert("Order deleted.");
                  onDeleteOrder(order._id);
                } else {
                  const error = await res.json();
                  alert("Delete failed: " + error.error);
                }
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 border border-red-400 rounded hover:bg-red-600 hover:text-white text-sm"
          >
            <FaTrash className="w-4 h-4" />
            Delete Order
          </button>
        )}
      </div>
    </>
  );
}
