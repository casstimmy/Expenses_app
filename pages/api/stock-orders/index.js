import { mongooseConnect } from "@/lib/mongoose";
import StockOrder from "@/models/StockOrder";
import Product from "@/models/Product";
import Vendor from "@/models/Vendor";
import { Staff } from "@/models/Staff";

export default async function handler(req, res) {
  await mongooseConnect();

  const { method } = req;

  if (method === "POST") {
    try {
      const {
        date,
        supplier,
        contact,
        mainProduct,
        reason,
        products,
        grandTotal,
        location,
        staff,
        vendor,
      } = req.body;

      



      // Validate required fields
      if (!staff) return res.status(400).json({ error: "Missing staff ID" });
      if (!date || !supplier || !products || products.length === 0) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Validate vendor
      const vendorDoc = await Vendor.findById(vendor);
      if (!vendorDoc) {
        return res.status(400).json({ error: "Vendor not found for supplier" });
      }

      // Create a price map from the vendor's product list
      const vendorPricesMap = {};
      vendorDoc.products.forEach((item) => {
        vendorPricesMap[item.product.toString()] = item.price;
      });

      // Prepare product data
    const formattedProducts = products.map((product) => ({
  name: product.name,
  quantity: product.quantity,
  price: product.costPrice, // or use product.price depending on naming
  total: product.total,
}));



      // Create stock order
      const order = await StockOrder.create({
        date,
        vendor,
        supplier: supplier.trim(),
        contact,
        location,
        mainProduct,
        reason,
        products: formattedProducts,
        grandTotal,
        staff,
      });

      return res.status(201).json({ success: true, order });

    } catch (err) {
      console.error("Failed to save stock order:", err.message);
      return res.status(500).json({ success: false, error: "Server error" });
    }
  }

  else if (method === "GET") {
    try {
      const { location, month, year } = req.query;
      const filters = {};

      if (location) filters.location = location;
      if (month && year) {
        const startDate = new Date(`${year}-${month}-01`);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
        filters.date = { $gte: startDate, $lt: endDate };
      }

      const orders = await StockOrder.find(filters)
        .populate("vendor")
        .populate("staff")
        .populate("products._id")
        .sort({ createdAt: -1 });

      return res.status(200).json(orders);

    } catch (err) {
      console.error("Failed to fetch stock orders:", err);
      return res.status(500).json({ error: "Failed to fetch stock orders" });
    }
  }
  else {
    res.setHeader("Allow", ["POST", "GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
