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

    // Detect existing product
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
      // Custom product: validate input
      if (!prod.name || !prod.category) {
        throw new Error("Product name and category are required for custom product");
      }

      const newProduct = await Product.create({
        name: prod.name.trim(),
        category: prod.category.trim(),
        costPrice: prod.price || 0, // Optional
      });

      productId = newProduct._id;
    }

    return {
            product: productId,
            name,
            quantity,
            costPrice,
            total,
          };
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
