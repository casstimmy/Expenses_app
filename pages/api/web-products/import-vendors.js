import { mongooseConnect } from "@/lib/mongoose";
import { requireAuth } from "@/lib/auth";
import WebProduct from "@/models/WebProduct";

// We need to import Vendor and Product so they're registered
import "@/models/Vendor";
import "@/models/Product";
import mongoose from "mongoose";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const staff = await requireAuth(req, res, ["admin", "Senior staff"]);
  if (!staff) return;

  await mongooseConnect();

  try {
    const Vendor = mongoose.model("Vendor");

    // Fetch all vendors with populated products
    const vendors = await Vendor.find({}).populate("products.product").lean();

    let imported = 0;
    let skipped = 0;

    for (const vendor of vendors) {
      if (!vendor.products || !vendor.products.length) continue;

      for (const vp of vendor.products) {
        const product = vp.product;
        if (!product || !product.name) continue;

        // Check if already exists in web products
        const existing = await WebProduct.findOne({
          name: { $regex: new RegExp(`^${product.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") },
        });

        if (existing) {
          // Link vendor product if not already linked
          if (!existing.vendorProduct) {
            existing.vendorProduct = product._id;
            await existing.save();
          }
          skipped++;
          continue;
        }

        await WebProduct.create({
          name: product.name,
          price: vp.price || product.costPrice || 0,
          category: product.category || "Vendor Product",
          vendorProduct: product._id,
          stock: 0,
          packSize: 1,
          packStock: 0,
          unitStock: 0,
        });
        imported++;
      }
    }

    return res.status(200).json({
      success: true,
      imported,
      skipped,
      message: `Imported ${imported} new products, ${skipped} already existed.`,
    });
  } catch (err) {
    console.error("Vendor import error:", err);
    return res.status(500).json({ error: "Failed to import vendor products." });
  }
}
