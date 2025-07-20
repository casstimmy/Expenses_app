import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: String,
  quantity: Number,
  price: Number,
  total: Number,
}, { _id: false });

const stockOrderSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  supplier: { type: String, required: true },
  contact: { type: String },
  location: { type: String },
  mainProduct: { type: mongoose.Schema.Types.Mixed }, // array or string
  reason: { type: String },
  grandTotal: { type: Number, required: true },
  products: [productSchema],


  vendor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true }, // <-- change this


  // ✅ New fields for payment tracking
  paymentMade: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  status: { type: String, enum: ["Not Paid", "Partly Paid", "Paid"], default: "Not Paid" },
  paymentDate: { type: String }, // you can use Date type too, but string is OK for display
}, { timestamps: true });

const StockOrder = mongoose.models.StockOrder || mongoose.model("StockOrder", stockOrderSchema);

export default StockOrder;
