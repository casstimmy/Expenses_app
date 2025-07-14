import { Printer, FileText, Send } from "lucide-react";
import { useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { VendorOrderText } from "./VendorOrderText ";


export default function StockOrderTable({ order }) {
  const printRef = useRef();

  if (!order) return null;


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
    const all = node.querySelectorAll("*");
    all.forEach((el) => {
      const style = window.getComputedStyle(el);
      if (style.color.includes("oklch")) el.style.color = "black";
      if (style.backgroundColor.includes("oklch")) el.style.backgroundColor = "white";
    });
  };

  const handleDownloadPDF = async () => {
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

  return (
    <>
      <div
        ref={printRef}
        style={{
          backgroundColor: "#ffffff",
          padding: "20px",
          fontFamily: "Arial, sans-serif",
          fontSize: "14px",
        }}
        className="mt-6"
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Order Details for: {order.supplier}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-gray-700 mb-4">
          <p><strong>Date:</strong> {order.date}</p>
          <p><strong>Supplier:</strong> {order.supplier}</p>
          <p><strong>Contact:</strong> {order.contact}</p>
        </div>

        <table className="w-full border border-gray-300">
          <thead>
            <tr style={{ backgroundColor: "#e5e7eb", color: "#374151" }}>
              <th className="text-left px-3 py-2 border">Product</th>
              <th className="text-right px-3 py-2 border">Qty</th>
              <th className="text-right px-3 py-2 border">Unit Cost</th>
              <th className="text-right px-3 py-2 border">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.products.map((item, i) => (
              <tr key={i} className="border-t">
                <td className="px-3 py-2 border">{item.product}</td>
                <td className="px-3 py-2 text-right border">{item.quantity}</td>
                <td className="px-3 py-2 text-right border">
                  ₦{parseFloat(item.costPerUnit).toLocaleString()}
                </td>
                <td className="px-3 py-2 text-right border">
                  ₦{parseFloat(item.total).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

       <div
  className="flex justify-end items-center mt-6 pt-4 border-t border-gray-300"
  style={{
    fontSize: "20px",
    fontWeight: "700",
    color: "#1d4ed8",
  }}
>
  <span className="mr-2">T-Total:</span>
  <span className="text-right">₦{parseFloat(order.grandTotal).toLocaleString()}</span>
</div>

      </div>

      <div className="flex justify-end gap-4 pt-4 print:hidden">
        <button
          onClick={handleWhatsApp}
          className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
        >
          <Send className="w-4 h-4" />
          WhatsApp
        </button>

        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          <FileText className="w-4 h-4" />
          PDF
        </button>

        <button
          onClick={handlePrint}
          className="flex items-center gap-1 px-3 py-2 bg-black text-white rounded hover:bg-gray-800 text-sm"
        >
          <Printer className="w-4 h-4" />
          Print
        </button>
      </div>
    </>
  );
}
