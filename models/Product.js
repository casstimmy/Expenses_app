import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String },
  costPrice: {type: Number},
});

export default mongoose.models.Product || mongoose.model("Product", ProductSchema);
