import { mongooseConnect } from "@/lib/mongoose";
import { Staff } from "@/models/Staff";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { name, password, location, role = "staff" } = req.body;

  if (!name || !password || !location) {
    return res.status(400).json({ message: "All fields are required." });
  }

  await mongooseConnect();

  const exists = await Staff.findOne({ name });
  if (exists) {
    return res.status(409).json({ message: "Staff with this name already exists." });
  }

  try {
    const newStaff = new Staff({ name, password, location, role });
    await newStaff.save();
    res.status(201).json({ message: "Staff created", id: newStaff._id });
  } catch (err) {
    console.error("Error creating staff:", err);
    res.status(500).json({ message: "Server error." });
  }
}
