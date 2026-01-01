import { mongooseConnect } from "@/lib/mongoose";
import Expense from "@/models/Expense";
import { DailyCash } from "@/models/DailyCash";

export default async function handler(req, res) {
  await mongooseConnect();

  const { date, location } = req.query;

  // validate date format YYYY-MM-DD
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !location) {
    return res.status(400).json({ error: "Missing or invalid date or location (expected YYYY-MM-DD)" });
  }

  try {
    // use the date string as day key (same format used in $dateToString)
    const todayStr = date;

    // Fetch today's cash record using the same timezone normalization used for expenses
    const cashRecord = await DailyCash.findOne({
      location,
      $expr: {
        $eq: [
          { $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: "Africa/Lagos" } },
          todayStr,
        ],
      },
    }).lean();

    // Fetch previous day's latest cash record (find the latest record whose day < todayStr)
    const prevCash = await DailyCash.findOne({
      location,
      $expr: {
        $lt: [
          { $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: "Africa/Lagos" } },
          todayStr,
        ],
      },
    })
      .sort({ date: -1 })
      .lean();

    const cashBroughtForward = Number(prevCash?.cashAtHand || 0);
    const cashToday = Number(cashRecord?.amount || 0);
    const staff = cashRecord?.staff || null;

    // Fetch expenses for today in this location (same as before)
    const expenses = await Expense.find({
      location,
      $expr: {
        $eq: [
          {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$date",
              timezone: "Africa/Lagos",
            },
          },
          todayStr,
        ],
      },
    }).lean();

    const payments = expenses.map((e) => ({
      title: e.title || "Untitled",
      amount: Number(e.amount || 0),
      date: e.date,
    }));

    const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalCashAvailable = cashBroughtForward + cashToday;
    const cashAtHand = totalCashAvailable - totalPayments;

    const response = {
      date: todayStr,
      location,
      cashBroughtForward,
      cashToday,
      totalCashAvailable,
      totalPayments,
      cashAtHand,
      payments,
      staff,
      note: cashRecord ? undefined : "No DailyCash record for this date; cashToday is 0",
    };

    return res.status(200).json(response);
  } catch (err) {
    console.error("❌ Daily cash report error:", err);
    return res.status(500).json({ error: "Failed to generate report" });
  }
}