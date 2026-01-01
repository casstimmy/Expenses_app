// ...existing code...
import { mongooseConnect } from "@/lib/mongoose";
import { DailyCash } from "@/models/DailyCash";
import Expense from "@/models/Expense";

export default async function handler(req, res) {
  await mongooseConnect();

  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed." });

  try {
    const { location } = req.body;
    const filter = location ? { location } : {};

    // Fetch all DailyCash entries in ascending date order
    const records = await DailyCash.find(filter).sort({ date: 1 });

    if (records.length === 0)
      return res.status(400).json({ error: "No records found." });

    let lastCashAtHand = 0;
    const updatedRecords = [];

    // Process day by day
    for (const record of records) {
      const { date, amount, location } = record;

      // Get previous day's cash at hand
      const cashBroughtForward = lastCashAtHand;

      // Calculate total expenses for this day
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      const expenses = await Expense.find({
        location,
        date: { $gte: start, $lt: end },
      });

      const totalPayments = expenses.reduce(
        (sum, e) => sum + Number(e.amount || 0),
        0
      );

      const cashToday = Number(amount || 0);
      const cashAtHand = cashBroughtForward + cashToday - totalPayments;

      // Update this record and get the updated document back
      const updated = await DailyCash.findByIdAndUpdate(
        record._id,
        {
          cashBroughtForward,
          totalPayments,
          cashAtHand,
        },
        { new: true } // return the updated document
      );

      // push plain object for response (avoid mongoose internals)
      updatedRecords.push({
        _id: updated._id,
        date: updated.date,
        location: updated.location,
        amount: updated.amount,
        cashBroughtForward: updated.cashBroughtForward,
        totalPayments: updated.totalPayments,
        cashAtHand: updated.cashAtHand,
      });

      lastCashAtHand = cashAtHand;
    }

    return res.status(200).json({
      message: "Cash at hand recalculated successfully.",
      updatedCount: updatedRecords.length,
      updatedRecords,
    });
  } catch (err) {
    console.error("❌ Error recalculating cash at hand:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}
