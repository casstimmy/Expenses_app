// components/ExportToPDF.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Base64 logo image (example, replace with your own or use an online URL)
const LOGO_URL = "/image/logo.png"; // Can also be base64 string

export default async function exportToPDF(filteredExpenses, report) {
  const doc = new jsPDF();
  let y = 10;

  // Load image
  const addLogo = async () => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = LOGO_URL;
      img.onload = () => {
        doc.addImage(img, "PNG", 10, 5, 15, 15); // (img, type, x, y, width, height)
        resolve();
      };
    });
  };

  await addLogo();

  y = 25; // adjust y after logo

  doc.setFontSize(16);
  doc.setTextColor(33, 37, 41); // dark text
  doc.text("Expense Report", 14, y);
  y += 10;

  if (report) {
    doc.setFontSize(12);
    doc.setTextColor(55, 65, 81); // muted gray
    doc.text(`Date: ${new Date(report.date).toLocaleDateString()}`, 14, y);
    y += 6;
    doc.text(`Location: ${report.location}`, 14, y);
    y += 10;
  }

  if (filteredExpenses.length === 0) {
    doc.text("No expenses found for this filter.", 14, y);
  } else {
    const tableRows = filteredExpenses.map((exp) => [
      exp.title,
      exp.category?.name || "Uncategorized",
      exp.location || "",
      new Date(exp.createdAt).toLocaleDateString(),
      `₦${Number(exp.amount).toLocaleString()}`,
    ]);

    autoTable(doc, {
      startY: y,
      head: [["Title", "Category", "Location", "Date", "Amount"]],
      body: tableRows,
      theme: "striped",
      styles: {
        fontSize: 10,
        cellPadding: 3,
        textColor: [33, 37, 41],
      },
      headStyles: {
        fillColor: [59, 130, 246], // Tailwind Blue-500
        textColor: 255,
        halign: "center",
        fontStyle: "bold",
      },
    });
  }

  doc.save("Expense_Report.pdf");
}
