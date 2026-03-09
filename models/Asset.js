import mongoose from "mongoose";

const AssetSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    image: { type: String },
    thumbnail: { type: String },
    description: { type: String, trim: true, default: "" },
    location: { type: String, trim: true },
    category: { type: String, trim: true, default: "" },
    value: { type: Number, default: 0 },
    status: { type: String, default: "Active", trim: true },
    statusHistory: [
      {
        status: { type: String, required: true },
        date: { type: Date, default: Date.now },
        note: { type: String, trim: true, default: "" },
      },
    ],
    addedBy: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.models.Asset || mongoose.model("Asset", AssetSchema);
