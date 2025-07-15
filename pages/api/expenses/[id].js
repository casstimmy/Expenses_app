import { mongooseConnect } from "@/lib/mongoose";
import Expense from "@/models/Expense";

export default async function handler(req, res) {
  await mongooseConnect();

  const { id } = req.query;

  if (req.method === "PUT") {
    try {
      const {
        title,
        amount,
        category,
        description,
        location,
        staffName,
        createdAt,
      } = req.body;

      const updated = await Expense.findByIdAndUpdate(
        id,
        {
          title,
          amount,
          category,
          description,
          location,
          createdAt,
          $set: { "staff.name": staffName }, // ✅ Only update staff.name
        },
        { new: true }
      );

      if (!createdAt || isNaN(new Date(createdAt))) {
        return res.status(400).json({ error: "Invalid or missing date" });
      }

      if (!updated) {
        return res.status(404).json({ error: "Expense not found" });
      }

      res.status(200).json(updated);
    } catch (err) {
      res
        .status(500)
        .json({ error: "Failed to update expense", details: err.message });
    }
  } else if (req.method === "GET") {
    try {
      const expense = await Expense.findById(id);
      if (!expense) return res.status(404).json({ error: "Expense not found" });
      res.status(200).json(expense);
    } catch (err) {
      res
        .status(500)
        .json({ error: "Failed to fetch expense", details: err.message });
    }
  } else {
    res.setHeader("Allow", ["PUT", "GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
