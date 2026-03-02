// pages/api/staff/logout.js — Clears the auth cookie
import { clearAuthCookie } from "@/lib/auth";

export default function handler(req, res) {
  clearAuthCookie(res);
  return res.status(200).json({ message: "Logged out successfully." });
}
