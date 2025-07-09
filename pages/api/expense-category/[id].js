import { mongooseConnect } from "@/lib/mongoose";
import ExpenseCategory from "@/models/ExpenseCategory";

export default async function handler(req, res) {
  await mongooseConnect();

  const {
    query: { id },
    method,
    body,
  } = req;

  if (method === "PUT") {
    if (!body.name || typeof body.name !== "string") {
      return res.status(400).json({ error: "Name is required and must be a string" });
    }

    try {
      const updated = await ExpenseCategory.findByIdAndUpdate(
        id,
        { name: body.name.trim() },
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({ error: "Category not found" });
      }

      return res.status(200).json(updated);
    } catch (error) {
      return res.status(500).json({ error: "Server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
