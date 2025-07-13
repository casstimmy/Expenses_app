import mongoose from "mongoose";

const VendorSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  vendorRep: String,
  repPhone: String,
  email: String,
  address: String,
  mainProduct: String,
  bankName: String,
  accountName: String,
  accountNumber: String,
  products: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      price: { type: Number, required: true },
    },
  ],
});

export default mongoose.models.Vendor || mongoose.model("Vendor", VendorSchema);
