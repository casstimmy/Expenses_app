// pages/api/daily-cash/[id].js
import { mongooseConnect } from "@/lib/mongoose";
import { DailyCash } from "@/models/DailyCash";

export default async function handler(req, res) {
  await mongooseConnect();
  const { id } = req.query;

  try {
    if (req.method === "PUT") {
      const { amount, date } = req.body;

      const updated = await DailyCash.findByIdAndUpdate(
        id,
        { amount, date },
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({ message: "Entry not found" });
      }

      return res.status(200).json(updated);
    } else {
      return res.status(405).json({ message: "Method not allowed" });
    }
  } catch (err) {
    console.error("Error updating daily cash:", err.message);
    return res.status(500).json({ message: err.message });
  }
}
