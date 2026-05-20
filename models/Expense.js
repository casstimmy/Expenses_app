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
    sourceType: { type: String, trim: true, default: "" },
    sourceId: { type: String, trim: true, default: "" },
    vendor: {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", default: null },
      companyName: { type: String, trim: true, default: "" },
    },
  },
  { timestamps: true }
);

ExpenseSchema.index({ date: -1 }); // improves sorting performance
ExpenseSchema.index({ location: 1, category: 1 });
ExpenseSchema.index({ sourceType: 1, sourceId: 1 });

export default mongoose.models.Expense ||
  mongoose.model("Expense", ExpenseSchema);
