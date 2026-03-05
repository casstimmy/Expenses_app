import { mongooseConnect } from "@/lib/mongoose";
import { Staff } from "@/models/Staff";
import mongoose from "mongoose";
import { requireAuth } from "@/lib/auth";

export default async function handler(req, res) {
  // Admin only
  const authStaff = await requireAuth(req, res, ["admin"]);
  if (!authStaff) return;

  await mongooseConnect();

  const { staffId, penaltyIndex } = req.query;

  if (!staffId || !mongoose.Types.ObjectId.isValid(staffId)) {
    return res.status(400).json({ message: "Invalid staff ID." });
  }

  const idx = Number(penaltyIndex);
  if (isNaN(idx) || idx < 0) {
    return res.status(400).json({ message: "Invalid penalty index." });
  }

  try {
    const staff = await Staff.findById(staffId);
    if (!staff) return res.status(404).json({ message: "Staff not found." });

    if (idx >= staff.penalty.length) {
      return res.status(400).json({ message: "Penalty index out of range." });
    }

    if (req.method === "PUT") {
      const { amount, reason, date } = req.body;
      if (amount !== undefined) staff.penalty[idx].amount = Number(amount);
      if (reason !== undefined) staff.penalty[idx].reason = reason;
      if (date !== undefined) staff.penalty[idx].date = new Date(date);

      await staff.save();
      return res.status(200).json({ message: "Penalty updated.", penalty: staff.penalty });
    }

    if (req.method === "DELETE") {
      staff.penalty.splice(idx, 1);
      await staff.save();
      return res.status(200).json({ message: "Penalty deleted.", penalty: staff.penalty });
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (err) {
    console.error("Penalty operation error:", err);
    return res.status(500).json({ message: "Server error." });
  }
}
