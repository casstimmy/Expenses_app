import { mongooseConnect } from "@/lib/mongoose";
import StockOrder from "@/models/StockOrder";
import Product from "@/models/Product"; // Needed if you want to link product details

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


      // Transform product list to include name, price, quantity, total
      const formattedProducts = products.map((prod) => ({
        name: prod.product || "",
        price: prod.costPerUnit || 0,
        quantity: prod.quantity || 0,
        total: prod.total || 0,
      }));

      const order = await StockOrder.create({
        date,
        supplier,
        contact,
        location,
        mainProduct,
        reason,
        products: formattedProducts, // Save full details
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
      const orders = await StockOrder.find().sort({ createdAt: -1 });
      res.status(200).json(orders);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch stock orders" });
    }
  }

  // Unsupported methods
  else {
    res.setHeader("Allow", ["POST", "GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
