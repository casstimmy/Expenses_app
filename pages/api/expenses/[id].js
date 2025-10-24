// pages/api/expenses/[id].js
import { mongooseConnect } from "@/lib/mongoose";
import Expense from "@/models/Expense";

export default async function handler(req, res) {
  await mongooseConnect();
  const { id } = req.query;

  // -------------------------
  // GET - fetch single expense
  // -------------------------
  if (req.method === "GET") {
    try {
      const expense = await Expense.findById(id).populate("category", "name");
      if (!expense) return res.status(404).json({ error: "Expense not found" });
      return res.status(200).json(expense);
    } catch (err) {
      console.error("GET /api/expenses/[id] error:", err);
      return res
        .status(500)
        .json({ error: "Failed to fetch expense", details: err.message });
    }
  }

  // -------------------------
  // PUT - update expense (preserve original time if only date provided)
  // -------------------------
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

      // Ensure createdAt is valid
      const formattedDate = createdAt ? new Date(createdAt) : null;
      if (!formattedDate || isNaN(formattedDate.getTime())) {
        return res.status(400).json({ error: "Invalid or missing date" });
      }

      const updateObj = {
        title,
        amount,
        category,
        description,
        location,
        createdAt: formattedDate,
      };

      const updated = await Expense.findByIdAndUpdate(id, updateObj, {
        new: true,
        runValidators: true,
      });

      if (!updated) return res.status(404).json({ error: "Expense not found" });

      // Staff update (separate)
      if (staffName && updated.staff) {
        updated.staff.name = staffName;
        await updated.save();
      }

      return res.status(200).json(updated);
    } catch (err) {
      console.error("PUT /api/expenses/[id] error:", err);
      return res
        .status(500)
        .json({ error: "Failed to update expense", details: err.message });
    }
  }

  // -------------------------
  // DELETE - remove expense
  // -------------------------
  if (req.method === "DELETE") {
    try {
      const removed = await Expense.findByIdAndDelete(id);
      if (!removed) return res.status(404).json({ error: "Expense not found" });
      return res
        .status(200)
        .json({ message: "Expense deleted", deletedId: id });
    } catch (err) {
      console.error("DELETE /api/expenses/[id] error:", err);
      return res
        .status(500)
        .json({ error: "Failed to delete expense", details: err.message });
    }
  }

  // Method not allowed
  res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
