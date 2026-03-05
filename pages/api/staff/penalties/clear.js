import { mongooseConnect } from "@/lib/mongoose";
import { Staff } from "@/models/Staff";
import { requireAuth } from "@/lib/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const authStaff = await requireAuth(req, res, ["admin"]);
  if (!authStaff) return;

  await mongooseConnect();

  try {
    // Clear all penalties for all staff
    await Staff.updateMany({}, { $set: { penalty: [] } });
    return res.status(200).json({ message: "All penalties cleared." });
  } catch (err) {
    console.error("Clear penalties error:", err);
    return res.status(500).json({ message: "Server error." });
  }
}
