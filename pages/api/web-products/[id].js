// pages/api/web-products/[id].js
import { mongooseConnect } from "@/lib/mongoose";
import WebProduct from "@/models/WebProduct";

export default async function handler(req, res) {
  await mongooseConnect();

  const { method } = req;
  const { id } = req.query;

  try {
    switch (method) {
      case "GET": {
        const product = await WebProduct.findById(id).lean();
        if (!product) return res.status(404).json({ message: "Product not found" });

        const normalized = {
          _id: product._id,
          name: product.name,
          category: product.category || "",
          price: product.price,
          description: product.description || "",
          images:
            (Array.isArray(product.images) && product.images.length > 0)
              ? product.images
              : (product.image ? [product.image] : []),
        };
        return res.status(200).json(normalized);
      }

      case "PUT":
      case "PATCH": {
        const update = { ...req.body };
        // Normalize incoming payload
        if (update.image && (!update.images || update.images.length === 0)) {
          update.images = [update.image];
        }
        if (update.images && !Array.isArray(update.images)) {
          update.images = [update.images].filter(Boolean);
        }

        const updated = await WebProduct.findByIdAndUpdate(id, update, {
          new: true,
          runValidators: true,
        }).lean();

        if (!updated) return res.status(404).json({ message: "Product not found" });

        const normalized = {
          _id: updated._id,
          name: updated.name,
          category: updated.category || "",
          price: updated.price,
          description: updated.description || "",
          images:
            (Array.isArray(updated.images) && updated.images.length > 0)
              ? updated.images
              : (updated.image ? [updated.image] : []),
        };
        return res.status(200).json(normalized);
      }

      case "DELETE": {
        const deleted = await WebProduct.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ message: "Product not found" });
        return res.status(200).json({ message: "Product deleted successfully" });
      }

      default:
        return res.status(405).json({ message: "Method Not Allowed" });
    }
  } catch (err) {
    console.error("Error in /api/web-products/[id]:", err);
    return res.status(500).json({ message: "Server Error" });
  }
}
