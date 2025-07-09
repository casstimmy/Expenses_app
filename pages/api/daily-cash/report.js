import { mongooseConnect } from "@/lib/mongoose";
import Expense from "@/models/Expense";
import { DailyCash } from "@/models/DailyCash";

export default async function handler(req, res) {
  await mongooseConnect();

  const { date, location } = req.query;

  if (!date || !location) {
    return res.status(400).json({ error: "Missing date or location" });
  }

  try {
    // Normalize date input
    const todayDate = new Date(`${date}T00:00:00.000Z`);
    const tomorrowDate = new Date(todayDate);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);

    const prevDate = new Date(todayDate);
    prevDate.setDate(prevDate.getDate() - 1);

    const todayStr = todayDate.toISOString().split("T")[0];

    // Fetch today's cash record
    const cashRecord = await DailyCash.findOne({
      location,
      date: { $gte: todayDate, $lt: tomorrowDate },
    });

    // Fetch previous day's latest cash record
    const prevCash = await DailyCash.findOne({
      location,
      date: { $lt: todayDate },
    }).sort({ date: -1 });

    const cashBroughtForward = Number(prevCash?.cashAtHand || 0);
    const cashToday = Number(cashRecord?.amount || 0);
    const staff = cashRecord?.staff || null;

    // Fetch expenses for today in this location
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
          todayStr,
        ],
      },
    });

    const payments = expenses.map((e) => ({
      title: e.title || "Untitled",
      amount: Number(e.amount || 0),
      date: e.createdAt,
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
    };

    res.status(200).json(response);
  } catch (err) {
    console.error("❌ Daily cash report error:", err);
    res.status(500).json({ error: "Failed to generate report" });
  }
}
