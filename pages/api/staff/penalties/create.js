import { mongooseConnect } from "@/lib/mongoose";
import { Staff } from "@/models/Staff";
import mongoose from "mongoose";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { staffId, amount, reason, date } = req.body;

  if (!staffId || !amount || isNaN(amount)) {
    return res.status(400).json({ message: "Valid staff ID and amount are required." });
  }

  // Check for valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(staffId)) {
    return res.status(400).json({ message: "Invalid staff ID format." });
  }

  await mongooseConnect();

  try {
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: "Staff not found in database." });
    }

    staff.penalty.push({
      amount: Number(amount),
      reason: reason?.trim() || "Unspecified",
      date: date ? new Date(date) : new Date(),
    });

    await staff.save();
    res.status(200).json({ message: "Penalty added successfully." });
  } catch (err) {
    console.error("Error adding penalty:", err);
    res.status(500).json({ message: "Server error." });
  }
}
