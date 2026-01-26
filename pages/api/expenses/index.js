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
    staff,
    date,
  } = req.body;

  if (!title || amount === undefined || !category || !date || !location) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);

  try {
    const expense = await Expense.create({
      title: title.trim(),
      amount: Number(amount),
      category,
      description: description || "",
      location,
      staff: staff || null,
      date: normalizedDate,
      createdAt: normalizedDate, // VERY IMPORTANT
    });

    const populated = await Expense.findById(expense._id).populate(
      "category",
      "name"
    );

    return res.status(201).json(populated);
  } catch (err) {
    console.error("❌ Expense save failed:", err);
    return res.status(500).json({ error: "Failed to save expense" });
  }
}

  return res.status(405).json({ error: "Method not allowed" });
}
