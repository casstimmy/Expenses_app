import mongoose, { Schema, model, models } from "mongoose";

const WebProductSchema = new Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: String,
  category: String,
  image: String,
}, {
  timestamps: true,
});

const WebProduct = models.WebProduct || model("WebProduct", WebProductSchema);
export default WebProduct;
