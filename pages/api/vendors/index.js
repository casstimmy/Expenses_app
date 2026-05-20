import { mongooseConnect } from "@/lib/mongoose";
import Vendor from "@/models/Vendor";
import { requireAuth } from "@/lib/auth";
import {
  buildVendorFields,
  getVendorTypeFilter,
  resolveVendorProducts,
} from "@/lib/vendor-utils";

export default async function handler(req, res) {
  const staff = await requireAuth(req, res);
  if (!staff) return;

  await mongooseConnect();

  if (req.method === "GET") {
    try {
      const vendors = await Vendor.find(getVendorTypeFilter(req.query.type))
        .populate("products.product")
        .sort({ companyName: 1 });
      return res.status(200).json(vendors);
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch vendors" });
    }
  }

  if (req.method === "POST") {
    try {
      const vendorFields = buildVendorFields(req.body);
      if (!vendorFields.companyName) {
        return res.status(400).json({ success: false, error: "Company name is required" });
      }

      const productRefs = await resolveVendorProducts(req.body.products);


      const vendor = await Vendor.create({
        ...vendorFields,
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
