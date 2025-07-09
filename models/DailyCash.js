// models/DailyCash.js
import mongoose from "mongoose";

const DailyCashSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  amount: { type: Number, required: true }, // today’s cash received
  cashBroughtForward: { type: Number, default: 0 }, // from yesterday
  totalPayments: { type: Number, default: 0 }, // total expenses today
  totalCashAvailable: { type: Number, default: 0 }, // forward + received
  cashAtHand: { type: Number, default: 0 }, // total - payments
  location: { type: String, required: true },
  staff: {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
    name: String,
    role: String,
    email: String,
  },
});


export const DailyCash =
  mongoose.models.DailyCash || mongoose.model("DailyCash", DailyCashSchema);
