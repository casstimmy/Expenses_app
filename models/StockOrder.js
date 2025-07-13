import mongoose, { Schema } from "mongoose";

const stockOrderSchema = new Schema(
  {
    date: { type: String, required: true },
    supplier: { type: String, required: true },
    contact: { type: String },
    mainProduct: { type: String },
    products: [
      {
        product: String,
        quantity: Number,
        costPerUnit: Number,
        total: Number,
      },
    ],
    grandTotal: Number,
  },
  { timestamps: true }
);

export default mongoose.models.StockOrder ||
  mongoose.model("StockOrder", stockOrderSchema);
