// pages/api/web-products/index.js
import { mongooseConnect } from "@/lib/mongoose";
import WebProduct from "@/models/WebProduct";

export default async function handler(req, res) {
  await mongooseConnect();

  try {
    const products = await WebProduct.find().lean();
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch web products" });
  }
}
