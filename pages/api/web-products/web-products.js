import { mongooseConnect } from "@/lib/mongoose";
import WebProduct from "@/models/WebProduct";

export default async function handler(req, res) {
  await mongooseConnect();

  try {
    const products = await WebProduct.find().lean();

    if (!products || products.length === 0) {
      return res.status(404).json({ message: "No products found" });
    }

    // Optional: Format or filter product data
    const formatted = products.map(product => ({
      _id: product._id,
      name: product.name,
      category: product.category || "",
      price: product.price,
      costPrice: product.costPrice || 0,
    }));

    res.status(200).json(formatted);
  } catch (err) {
    console.error("Error fetching web products:", err);
    res.status(500).json({ message: "Failed to fetch products" });
  }
}
