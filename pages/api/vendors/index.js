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

    // Destructure all expected fields from prod
    const { product, name, category, price, quantity, costPrice, total } = prod;

    if (product && product !== "custom") {
      if (typeof product === "string" && mongoose.Types.ObjectId.isValid(product)) {
        productId = new mongoose.Types.ObjectId(product);
      } else {
        throw new Error(`Invalid product ID: ${product}`);
      }
    } else {
      // Custom product
      if (!name || !category) {
        throw new Error("Product name and category are required for custom product");
      }

      const newProduct = await Product.create({
        name: name.trim(),
        category: category.trim(),
        price: price || 0, // Optional fallback
      });

      productId = newProduct._id;
    }

    return {
      product: productId,
      name,
      quantity,
      price,
      total,
    };
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
      console.error("Error creating vendor:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
