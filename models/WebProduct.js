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
    // Stock management - pack/unit tier system
    stock: { type: Number, default: 0 }, // total individual units available
    packSize: { type: Number, default: 1 }, // how many units in one pack/carton (1 = no packs)
    packStock: { type: Number, default: 0 }, // number of full packs/cartons
    unitStock: { type: Number, default: 0 }, // loose individual units
    unitPrice: { type: Number, default: 0 }, // price per single unit
    packPrice: { type: Number, default: 0 }, // price per pack/carton
    // Link to vendor product
    vendorProduct: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
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
