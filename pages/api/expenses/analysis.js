// pages/api/expenses/analysis.js
import { mongooseConnect } from "@/lib/mongoose";
import Expense from "@/models/Expense";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  
}
