// pages/api/daily-cash/index.js
import { mongooseConnect } from "@/lib/mongoose";
import { DailyCash } from "@/models/DailyCash";
import Expense from "@/models/Expense";

export default async function handler(req, res) {
  await mongooseConnect();

  if (req.method === "POST") {
    const { amount, date, location, staff } = req.body;

    if (amount == null || !date || !location) {
      return res
        .status(400)
        .json({ error: "Amount, date, and location are required." });
    }

    try {
      // Standardize the date to start of day (UTC)
      const [year, month, day] = date.split("-").map(Number);
      const cashDate = new Date(Date.UTC(year, month - 1, day));
      const dateStr = date;

      // 1. Get previous day's cashAtHand
      const prevDate = new Date(cashDate);
      prevDate.setDate(prevDate.getDate() - 1);

      const prevCash = await DailyCash.findOne({
        location,
        date: { $lt: cashDate },
      }).sort({ date: -1 });

      const cashBroughtForward = Number(prevCash?.cashAtHand || 0);

      // 2. Get total expenses for this date
      const expenses = await Expense.find({
        location,
        $expr: {
          $eq: [
            {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone: "Africa/Lagos",
              },
            },
            dateStr,
          ],
        },
      });

      const totalPayments = expenses.reduce(
        (sum, e) => sum + Number(e.amount || 0),
        0
      );

      const cashToday = Number(amount);
      const totalCashAvailable = cashBroughtForward + cashToday;
      const cashAtHand = totalCashAvailable - totalPayments;

      // 3. Save or update the record
      const updatedRecord = await DailyCash.findOneAndUpdate(
        { date: cashDate, location },
        {
          $set: {
            amount: cashToday,
            cashAtHand,
            location,
            date: cashDate,
            staff,
          },
        },
        { upsert: true, new: true }
      );

      return res.status(200).json(updatedRecord);
    } catch (error) {
      console.error("❌ Error saving daily cash:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  }

  if (req.method === "GET") {
    const { location } = req.query;

    try {
      const filter = location ? { location } : {};
      const records = await DailyCash.find(filter).sort({ date: -1 });
      return res.status(200).json(records);
    } catch (error) {
      console.error("❌ Error fetching daily cash records:", error);
      return res
        .status(500)
        .json({ error: "Could not fetch daily cash records." });
    }
  }

  return res.status(405).json({ error: "Method not allowed." });
}
