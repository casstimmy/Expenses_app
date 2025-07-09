// pages/api/expenses/report.js

import { mongooseConnect } from "@/lib/mongoose";
import Expense from "@/models/Expense";
import PDFDocument from "pdfkit";

export default async function handler(req, res) {
  await mongooseConnect();

  const expenses = await Expense.find().sort({ createdAt: -1 });

  // Create a PDF doc
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="ExpenseReport.pdf"');

  doc.pipe(res);

  doc.fontSize(20).text("Expense Report", { align: "center" });
  doc.moveDown();

  let total = 0;

  expenses.forEach((exp, i) => {
    doc
      .fontSize(12)
      .fillColor("black")
      .text(`${i + 1}. ${exp.title}`, { continued: true })
      .fillColor("blue")
      .text(`  ₦${Number(exp.amount).toLocaleString()}`, { align: "right" });

    doc
      .fontSize(10)
      .fillColor("gray")
      .text(`Category: ${exp.category} | ${new Date(exp.createdAt).toLocaleDateString()}`);

    if (exp.description) {
      doc.fontSize(10).fillColor("black").text(`Note: ${exp.description}`);
    }

    doc.moveDown();
    total += Number(exp.amount);
  });

  doc.moveDown(2);
  doc.fontSize(14).fillColor("black").text(`Total Expenses: ₦${total.toLocaleString()}`, { align: "right" });

  doc.end();
}
