import { mongooseConnect } from "@/lib/mongoose";
import Vendor from "@/models/Vendor";
import Product from "@/models/Product";
import mongoose from "mongoose";

export default async function handler(req, res) {
  await mongooseConnect();

  if (req.method === "GET") {
    try {
      const vendors = await Vendor.find().populate("products.product");
      return res.status(200).json(vendors);
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch vendors" });
    }
  }

  if (req.method === "POST") {

    const normalizeCategory = (category) => {
  const found = productCategories.find((c) => c.toLowerCase() === category.toLowerCase());
  return found || category;
};

    try {
      const {
        companyName,
        vendorRep,
        repPhone,
        email,
        address,
        mainProduct,
        bankName,
        accountName,
        accountNumber,
        products,
      } = req.body;

     const productRefs = await Promise.all(
  products.map(async (prod) => {
    let productId;

    if (prod.product && prod.product !== "custom") {
      if (
        typeof prod.product === "string" &&
        mongoose.Types.ObjectId.isValid(prod.product)
      ) {
        productId = new mongoose.Types.ObjectId(prod.product);
      } else {
        throw new Error(`Invalid product ID: ${prod.product}`);
      }
    } else {
      if (!prod.name || !prod.category) {
        throw new Error("Product name and category are required for custom product");
      }

      const newProduct = await Product.create({
        name: prod.name.trim(),
        category: prod.category.trim(),
        costPrice: prod.price || 0, // optional for custom
      });

      productId = newProduct._id;
    }

    return { product: productId, price: prod.price }; // ✅ price included
  })
);




      const vendor = await Vendor.create({
        companyName,
        vendorRep,
        repPhone,
        email,
        address,
        mainProduct,
        bankName,
        accountName,
        accountNumber,
        products: productRefs,
      });

      return res.status(201).json({ success: true, vendor });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // This should only run if method is neither GET nor POST
  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
