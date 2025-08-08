import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  name: { type: String, required: true },
  quantity: Number,
  price: Number,
  total: Number,
  
});


const stockOrderSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  supplier: { type: String, required: true },
  contact: { type: String },
  location: { type: String },
  mainProduct: { type: mongoose.Schema.Types.Mixed }, // array or string
  reason: { type: String },
  grandTotal: { type: Number, required: true },
  products: [productSchema],
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },

  // ✅ New: track which staff submitted this order
  staff: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true },

  // ✅ Payment tracking
  paymentMade: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  status: { type: String, enum: ["Not Paid", "Partly Paid", "Paid"], default: "Not Paid" },
  paymentDate: { type: String }, // You can use Date if preferred
}, { timestamps: true });

const StockOrder = mongoose.models.StockOrder || mongoose.model("StockOrder", stockOrderSchema);

export default StockOrder;
