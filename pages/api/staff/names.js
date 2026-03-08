import { mongooseConnect } from "@/lib/mongoose";
import { Staff } from "@/models/Staff";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  await mongooseConnect();

  try {
    const staff = await Staff.find({ active: true }, "name").lean();
    return res.status(200).json(staff.map((s) => s.name));
  } catch (err) {
    console.error("Staff names error:", err);
    return res.status(500).json({ message: "Failed to fetch staff names" });
  }
}
