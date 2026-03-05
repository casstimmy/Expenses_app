import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String },
  costPrice: { type: Number },
  isPack: { type: Boolean, default: false },
  unitsPerPack: { type: Number, default: 1 },
});

export default mongoose.models.Product || mongoose.model("Product", ProductSchema);
