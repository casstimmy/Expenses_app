import { mongooseConnect } from "@/lib/mongoose";
import Vendor from "@/models/Vendor";
import { requireAuth } from "@/lib/auth";
import { buildVendorFields, resolveVendorProducts } from "@/lib/vendor-utils";

export default async function handler(req, res) {
  const staff = await requireAuth(req, res);
  if (!staff) return;

  await mongooseConnect();

  const { id } = req.query;

  if (req.method === "PUT") {
    try {
      const vendorFields = buildVendorFields(req.body, req.body.vendorType);
      if (!vendorFields.companyName) {
        return res.status(400).json({ error: "Company name is required" });
      }

      const productRefs = await resolveVendorProducts(req.body.products);


      const updated = await Vendor.findByIdAndUpdate(
        id,
        {
          ...vendorFields,
          products: productRefs,
        },
        { new: true, runValidators: true }
      );

      if (!updated) {
        return res.status(404).json({ error: "Vendor not found" });
      }

      await updated.populate("products.product");

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
