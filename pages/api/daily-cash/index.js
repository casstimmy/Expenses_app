// pages/api/daily-cash/index.js
import { mongooseConnect } from "@/lib/mongoose";
import { DailyCash } from "@/models/DailyCash";
import Expense from "@/models/Expense";

export default async function handler(req, res) {
  await mongooseConnect();

  try {
    switch (req.method) {
      // 💾 Create or update daily cash record
      case "POST": {
        const { amount, date, location, staff } = req.body;
        if (!amount || !date || !location)
          return res.status(400).json({ error: "Amount, date, and location are required." });

        const cashDate = new Date(date);
        cashDate.setUTCHours(0, 0, 0, 0);

        // Get previous day's record
        const prevCash = await DailyCash.findOne({ location, date: { $lt: cashDate } })
          .sort({ date: -1 })
          .lean();

        const cashBroughtForward = Number(prevCash?.cashAtHand || 0);

        // Calculate total expenses for this date
        const start = new Date(cashDate);
        const end = new Date(cashDate);
        end.setDate(end.getDate() + 1);

        const expenses = await Expense.find({
          location,
          createdAt: { $gte: start, $lt: end },
        }).lean();

        const totalPayments = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
        const cashToday = Number(amount);
        const cashAtHand = cashBroughtForward + cashToday - totalPayments;

        const updatedRecord = await DailyCash.findOneAndUpdate(
          { date: cashDate, location },
          {
            amount: cashToday,
            cashBroughtForward,
            totalPayments,
            cashAtHand,
            location,
            date: cashDate,
            staff,
          },
          { upsert: true, new: true }
        );

        return res.status(200).json(updatedRecord);
      }

      // 📦 Fetch daily cash records
      case "GET": {
        const { location } = req.query;
        const filter = location ? { location } : {};
        const records = await DailyCash.find(filter).sort({ date: -1 }).lean();
        return res.status(200).json(records);
      }

      default:
        return res.status(405).json({ error: "Method not allowed." });
    }
  } catch (error) {
    console.error("❌ Daily Cash API error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
}
