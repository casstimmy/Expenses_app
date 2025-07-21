import { mongooseConnect } from "@/lib/mongoose";
import StockOrder from "@/models/StockOrder";
import Product from "@/models/Product"; // Needed if you want to link product details
import Vendor from "@/models/Vendor";



export default async function handler(req, res) {
  await mongooseConnect();

  if (req.method === "POST") {
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
      } = req.body;

      if (!date || !supplier || !products || products.length === 0) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      // Lookup the vendor by companyName
      const vendor = await Vendor.findOne({ companyName: supplier });




      if (!vendor) {
        return res.status(400).json({ error: "Vendor not found for supplier" });
      }


      // Transform product list to include name, price, quantity, total
      const formattedProducts = products.map((prod) => ({
        name: prod.product || "",
        price: prod.costPerUnit || 0,
        quantity: prod.quantity || 0,
        total: prod.total || 0,
      }));

      const cleanSupplier = typeof supplier === "string" ? supplier.trim() : supplier;

     const order = await StockOrder.create({
  date,
  vendor: vendor._id,
  supplier: cleanSupplier,
  contact,
  location,
  mainProduct,
  reason,
  products: formattedProducts,
  grandTotal,
});

      res.status(201).json({ success: true, order });
    } catch (err) {
      console.error("Failed to save stock order:", err);
      res.status(500).json({ success: false, error: "Server error" });
    }
  }

  // GET request to fetch all orders
 else if (req.method === "GET") {
  try {
    const { location, month, year } = req.query;

    const filters = {};

    if (location) {
      filters.location = location;
    }

    if (month && year) {
      const startDate = new Date(`${year}-${month}-01`);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1); // Next month

      filters.date = { $gte: startDate, $lt: endDate };
    }

    const orders = await StockOrder.find(filters)
      .populate("vendor")
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (err) {
    console.error("Failed to fetch stock orders:", err);
    res.status(500).json({ error: "Failed to fetch stock orders" });
  }
}


  // Unsupported methods
  else {
    res.setHeader("Allow", ["POST", "GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
