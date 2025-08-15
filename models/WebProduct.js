// models/WebProduct.js
import mongoose, { Schema } from "mongoose";

const WebProductSchema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: String,
    category: { type: String, default: "Top Level" },
    // New preferred field
    images: { type: [String], default: [] },
    // Legacy field (kept for migration/back-compat)
    image: { type: String, default: undefined },
  },
  { timestamps: true }
);

// If doc only has legacy `image`, migrate it to `images`
WebProductSchema.pre("validate", function (next) {
  if ((!this.images || this.images.length === 0) && this.image) {
    this.images = [this.image];
  }
  next();
});

// IMPORTANT in dev: force-refresh the model so schema changes take effect
// without needing a full server restart.
if (mongoose.models.WebProduct) {
  mongoose.deleteModel("WebProduct");
}
const WebProduct = mongoose.model("WebProduct", WebProductSchema);

export default WebProduct;
