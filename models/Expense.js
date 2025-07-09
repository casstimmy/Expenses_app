import mongoose from "mongoose";

const ExpenseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ExpenseCategory",
    required: true,
  },
  location: {
    type: String,
    default: null,
  },
  staffName: {
    type: String,
    default: null,
  },
  date: { type: Date, default: Date.now },
  description: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.models.Expense || mongoose.model("Expense", ExpenseSchema);
