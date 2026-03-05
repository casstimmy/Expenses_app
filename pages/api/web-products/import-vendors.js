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
    let unitsCreated = 0;

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
          // Update pack info if product is a pack
          if (product.isPack && product.unitsPerPack > 1) {
            existing.packSize = product.unitsPerPack;
            existing.packPrice = vp.price || product.costPrice || existing.price;
            existing.unitPrice = (existing.packPrice / product.unitsPerPack);
            await existing.save();

            // Auto-create unit variant if it doesn't exist
            const unitName = `${product.name} (Unit)`;
            const existingUnit = await WebProduct.findOne({
              name: { $regex: new RegExp(`^${unitName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") },
            });
            if (!existingUnit) {
              await WebProduct.create({
                name: unitName,
                price: existing.unitPrice,
                category: product.category || existing.category || "Vendor Product",
                vendorProduct: product._id,
                stock: 0,
                packSize: 1,
                packStock: 0,
                unitStock: 0,
                unitPrice: existing.unitPrice,
                packPrice: 0,
              });
              unitsCreated++;
            }
          }
          skipped++;
          continue;
        }

        const isPack = product.isPack && product.unitsPerPack > 1;
        const packPrice = vp.price || product.costPrice || 0;
        const unitPrice = isPack ? (packPrice / product.unitsPerPack) : 0;

        await WebProduct.create({
          name: product.name,
          price: packPrice,
          category: product.category || "Vendor Product",
          vendorProduct: product._id,
          stock: 0,
          packSize: isPack ? product.unitsPerPack : 1,
          packStock: 0,
          unitStock: 0,
          packPrice: isPack ? packPrice : 0,
          unitPrice: isPack ? unitPrice : 0,
        });
        imported++;

        // Auto-create unit variant for pack products
        if (isPack) {
          const unitName = `${product.name} (Unit)`;
          await WebProduct.create({
            name: unitName,
            price: unitPrice,
            category: product.category || "Vendor Product",
            vendorProduct: product._id,
            stock: 0,
            packSize: 1,
            packStock: 0,
            unitStock: 0,
            unitPrice: unitPrice,
            packPrice: 0,
          });
          unitsCreated++;
        }
      }
    }

    return res.status(200).json({
      success: true,
      imported,
      skipped,
      unitsCreated,
      message: `Imported ${imported} new products, ${skipped} already existed, ${unitsCreated} unit variants auto-created.`,
    });
  } catch (err) {
    console.error("Vendor import error:", err);
    return res.status(500).json({ error: "Failed to import vendor products." });
  }
}
