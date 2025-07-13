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

          if (prod.productId && prod.productId !== "custom") {
            productId = mongoose.Types.ObjectId(prod.productId);
          } else {
            const newProduct = await Product.create({
              name: prod.name.trim(),
              category: prod.category,
            });
            productId = newProduct._id;
          }

          return { product: productId };
        })
      );

      console.log("productRefs:", productRefs)

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
