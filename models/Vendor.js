import mongoose from "mongoose";

const VendorSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  vendorType: {
    type: String,
    enum: ["stock", "petty-cash"],
    default: "stock",
    index: true,
  },
  vendorRep: String,
  repPhone: String,
  email: String,
  address: String,
  mainProduct: String,
  businessCategory: String,
  serviceDescription: String,
  paymentTerms: String,
  bankName: String,
  accountName: String,
  accountNumber: String,
  onboardingToken: { type: String, unique: true, sparse: true },
  onboardingComplete: { type: Boolean, default: false },
  onboardingSentAt: Date,
  onboardingSubmittedAt: Date,
  termsAccepted: { type: Boolean, default: false },
  termsAcceptedAt: Date,
  termsVersion: String,
  products: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      price: { type: Number, required: true },
    },
  ],
});

export default mongoose.models.Vendor || mongoose.model("Vendor", VendorSchema);
