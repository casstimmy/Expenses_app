import { mongooseConnect } from "@/lib/mongoose";
import Vendor from "@/models/Vendor";
import Product from "@/models/Product";
import mongoose from "mongoose";

export default async function handler(req, res) {
  await mongooseConnect();

  const { id } = req.query;

  if (req.method === "PUT") {

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

          // Handle empty or undefined productId
          if (prod.productId && prod.productId !== "custom") {
            if (typeof prod.productId === "string" && mongoose.Types.ObjectId.isValid(prod.productId)) {
              productId = new mongoose.Types.ObjectId(prod.productId);
            } else {
              throw new Error(`Invalid productId: ${prod.productId}`);
            }
          } else {
            if (!prod.name || !prod.category) {
              throw new Error("Product name and category are required for custom product");
            }
            const newProduct = await Product.create({
              name: prod.name.trim(),
              category: prod.category,
            });
            productId = newProduct._id;
          }

          return { product: productId };
        })
      );

      const updated = await Vendor.findByIdAndUpdate(
        id,
        {
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
        },
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({ error: "Vendor not found" });
      }

      res.status(200).json(updated);
    } catch (err) {
      console.error("Update vendor error:", err);
      res.status(500).json({ error: "Failed to update vendor", details: err.message });
    }
  } else {
    res.setHeader("Allow", ["PUT"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
