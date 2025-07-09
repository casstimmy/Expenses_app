// /pages/api/staff/[id].js
import { mongooseConnect } from "@/lib/mongoose";
import { Staff } from "@/models/Staff";
import bcrypt from "bcrypt";

export default async function handler(req, res) {
  const { id } = req.query;

  await mongooseConnect();

  if (req.method === "PUT") {
    const { name, password, location, role } = req.body;

    if (!name || !location || !role) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const updateData = {
      name,
      location,
      role,
    };

    // Only hash password if provided and non-empty
    if (password && password.trim() !== "") {
      const hashed = await bcrypt.hash(password, 10);
      updateData.password = hashed;
    }

    try {
      await Staff.findByIdAndUpdate(id, updateData);
      res.status(200).json({ message: "Staff updated" });
    } catch (err) {
      console.error("Update failed:", err);
      res.status(500).json({ message: "Server error" });
    }
  } else if (req.method === "DELETE") {
    try {
      await Staff.findByIdAndDelete(id);
      res.status(200).json({ message: "Staff deleted" });
    } catch (err) {
      console.error("Delete failed:", err);
      res.status(500).json({ message: "Server error" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
