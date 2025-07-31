// /pages/api/staff/login.js
import { mongooseConnect } from "@/lib/mongoose";
import { Staff } from "@/models/Staff";
import bcrypt from "bcrypt";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ message: "Name and password are required" });
  }

  await mongooseConnect();

 const staff = await Staff.findOne({ name, role: { $ne: "junior staff" } }).select("+password");

if (!staff) {
  return res.status(401).json({ message: "Staff not found" });
}


  // 🚫 Reject junior staff
  if (staff.role === "junior staff") {
    return res.status(403).json({ message: "Unauthorized: Access denied" });
  }

  const isMatch = await bcrypt.compare(password, staff.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid password" });
  }

  const staffObj = staff.toObject();
  delete staffObj.password;

  res.status(200).json(staffObj);
}
