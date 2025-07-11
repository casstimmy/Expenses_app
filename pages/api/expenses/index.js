import { mongooseConnect } from "@/lib/mongoose";
import Expense from "@/models/Expense";
import ExpenseCategory from "@/models/ExpenseCategory";

export default async function handler(req, res) {
  await mongooseConnect();

  if (req.method === "GET") {
    try {
      const expenses = await Expense.find()
        .populate("category", "name")
        .sort({ createdAt: -1 });

      return res.status(200).json(expenses);
    } catch (err) {
      console.error("GET error:", err);
      return res.status(500).json({ error: "Failed to fetch expenses" });
    }
  }

  if (req.method === "POST") {
    const {
      title,
      amount,
      category,
      description,
      location,
      staff, // ✅ expect "staff" (not staffName)
    } = req.body;

    if (!title || !amount || !category) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const newExpense = await Expense.create({
        title,
        amount,
        category,
        description,
        location: location || null,
        staff: staff || null,
      });

      return res.status(201).json(newExpense);
    } catch (err) {
      console.error("❌ Expense save failed:", err);
      return res.status(500).json({ error: "Failed to save expense" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
