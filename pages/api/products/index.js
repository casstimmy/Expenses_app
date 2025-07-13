import { mongooseConnect } from "@/lib/mongoose";
import Product from "@/models/Product";

export default async function handler(req, res) {
  await mongooseConnect();

  if (req.method === "GET") {
    try {
      const products = await Product.find({}, "name category");
      res.status(200).json(products);
    } catch (err) {
      console.error("GET /api/products failed", err);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  }

  if (req.method === "POST") {
    try {
      const { name, category } = req.body;

      if (!name || !category) {
        return res.status(400).json({ error: "Name and category are required" });
      }

      const product = await Product.create({ name: name.trim(), category });
      res.status(201).json(product);
    } catch (err) {
      console.error("POST /api/products failed", err);
      res.status(500).json({ error: "Failed to create product" });
    }
  } else if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
