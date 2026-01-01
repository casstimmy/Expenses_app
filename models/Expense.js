import mongoose from "mongoose";

const ExpenseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExpenseCategory",
      required: true,
    },
    location: { type: String, default: null, trim: true },
    staff: {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
      name: { type: String, trim: true },
      role: { type: String, trim: true },
      email: { type: String, lowercase: true, trim: true },
    },
    description: { type: String, trim: true },
    date: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

ExpenseSchema.index({ date: -1 }); // improves sorting performance
ExpenseSchema.index({ location: 1, category: 1 });

export default mongoose.models.Expense ||
  mongoose.model("Expense", ExpenseSchema);
