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

  const staff = await Staff.findOne({ name }).select("+password"); // if password is being excluded

  if (!staff) {
    return res.status(401).json({ message: "Staff not found" });
  }

  const isMatch = await bcrypt.compare(password, staff.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid password" });
  }

  // Now convert to plain object and remove password manually
  const staffObj = staff.toObject();
  delete staffObj.password;

  res.status(200).json(staffObj);

  try {
  // login logic here...
} catch (err) {
  console.error("Login error:", err);
  res.status(500).json({ message: "Server error" });
}

}
