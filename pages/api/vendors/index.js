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

          const {
            product,
            name,
            category,
            quantity,
            costPerUnit,
            total,
            price, // optional for custom product
          } = prod;

          if (product && product !== "custom") {
            // Existing product ID
            if (
              typeof product === "string" &&
              mongoose.Types.ObjectId.isValid(product)
            ) {
              productId = new mongoose.Types.ObjectId(product);
            } else {
              throw new Error(`Invalid product ID: ${product}`);
            }
          } else {
            // New custom product
            if (!name || !category) {
              throw new Error("Product name and category are required for custom products");
            }

            const newProduct = await Product.create({
              name: name.trim(),
              category: category.trim(),
              costPrice: price || costPerUnit || 0,
            });

            productId = newProduct._id;
          }

          return {
  product: productId,
  name: name?.trim() || "",
  quantity: quantity || 0,
  costPerUnit: costPerUnit || 0,
  total: total || 0,
  price: price || costPerUnit || 0, // Ensures vendor schema validation
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
