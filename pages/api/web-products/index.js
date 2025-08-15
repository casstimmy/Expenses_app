// pages/api/web-products/index.js
import { mongooseConnect } from "@/lib/mongoose";
import WebProduct from "@/models/WebProduct";

export default async function handler(req, res) {
  await mongooseConnect();

  const { method } = req;

  try {
    switch (method) {
      case "GET": {
        const products = await WebProduct.find().lean();

        // Return empty array (not 404) so the UI can handle "no results" gracefully
        if (!products || products.length === 0) {
          return res.status(200).json([]);
        }

        // Normalize legacy `image` -> `images`
        const formatted = products.map((p) => ({
          _id: p._id,
          name: p.name,
          category: p.category || "",
          price: p.price,
          description: p.description || "",
          images:
            (Array.isArray(p.images) && p.images.length > 0)
              ? p.images
              : (p.image ? [p.image] : []),
        }));

        return res.status(200).json(formatted);
      }

      case "POST": {
        // Make sure images is an array (helps when creating)
        const body = { ...req.body };
        if (body.image && (!body.images || body.images.length === 0)) {
          body.images = [body.image];
        }
        if (!Array.isArray(body.images)) body.images = [];

        const newProduct = await WebProduct.create(body);
        // Return normalized
        const normalized = {
          _id: newProduct._id,
          name: newProduct.name,
          category: newProduct.category || "",
          price: newProduct.price,
          description: newProduct.description || "",
          images: newProduct.images || [],
        };
        return res.status(201).json(normalized);
      }

      default:
        return res.status(405).json({ message: "Method Not Allowed" });
    }
  } catch (err) {
    console.error("Error in /api/web-products:", err);
    return res.status(500).json({ message: "Server Error" });
  }
}
