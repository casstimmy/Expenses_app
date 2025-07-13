import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String },
});

export default mongoose.models.Product || mongoose.model("Product", ProductSchema);
