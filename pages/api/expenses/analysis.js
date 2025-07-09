// pages/api/expenses/analysis.js
import { mongooseConnect } from "@/lib/mongoose";
import Expense from "@/models/Expense";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await mongooseConnect();

    const expenses = await Expense.find({})
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .lean();

    const totalSpent = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

    // Group by category
    const categoryTotals = {};
    expenses.forEach((exp) => {
      const cat = exp.category?.name || "Uncategorized";
      categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(exp.amount);
    });

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Disposition", 'attachment; filename="ExpenseReport.pdf"');
    doc.pipe(res);

    // Title & Branding
    doc
    .image("public/images/st-micheals-logo.png", 50, 40, { width: 60 })
      .moveDown(0.5)
      .moveTo(50, doc.y - 8);
    
    
    doc
      .fillColor("#1D4ED8")
      .fontSize(26)
      .font("Helvetica-Bold")
      .text("Expense Report", { align: "center" });

    doc
      .moveTo(50, doc.y + 5)
      .lineTo(550, doc.y + 5)
      .strokeColor("#60A5FA")
      .lineWidth(1.5)
      .stroke()
      .moveDown(2);

    // Summary
    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor("#000")
      .text("Summary", { underline: true });

    doc
      .font("Helvetica")
      .fontSize(12)
      .text(`Total Expenses: ₦${totalSpent.toLocaleString()}`)
      .moveDown(0.5);

    doc.font("Helvetica").text("Category Breakdown:");
    Object.entries(categoryTotals).forEach(([cat, amt]) => {
      doc
        .fillColor("#1F2937")
        .text(`• ${cat}: ₦${amt.toLocaleString()}`);
    });

    doc.moveDown(1.5);

    // Expense Table Header
    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor("#1D4ED8")
      .text("Details of Expenses", { underline: true })
      .moveDown(0.5);

    expenses.forEach((exp, index) => {
      doc
        .rect(48, doc.y - 2, 500, 70)
        .fillOpacity(0.05)
        .fillAndStroke("#E0F2FE", "#E0F2FE");

      doc
        .fillOpacity(1)
        .font("Helvetica-Bold")
        .fontSize(12)
        .fillColor("#0F172A")
        .text(`${index + 1}. ${exp.title}`, 52, doc.y + 2);

      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor("#374151")
        .text(`Amount: ₦${Number(exp.amount).toLocaleString()}`, { continued: true })
        .text(`  |  Category: ${exp.category?.name || "Uncategorized"}`);

      doc.text(`Location: ${exp.location || "N/A"}`);
      doc.text(`Date: ${new Date(exp.createdAt).toLocaleDateString()}`);
      doc.moveDown(1.5);
    });

    // Footer
    doc
      .moveDown(2)
      .fontSize(10)
      .fillColor("#9CA3AF")
      .text(`Generated on ${new Date().toLocaleString()}`, 50, doc.page.height - 50, {
        align: "center",
        width: 500,
      });

    doc.end();
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({ message: "Failed to generate PDF" });
  }
}
