// pages/api/stock-orders/[id]/products/[index].js

import StockOrder from '@/models/StockOrder';
import { mongooseConnect } from "@/lib/mongoose";
import Product from "@/models/Product";

export default async function handler(req, res) {
  const { id, index } = req.query;

  await mongooseConnect();

  if (req.method === 'PUT') {
    try {
      const order = await StockOrder.findById(id);
      if (!order) return res.status(404).json({ error: "Order not found" });

      order.products.splice(index, 1);
      order.grandTotal = order.products.reduce((sum, p) => sum + p.total, 0);
      await order.save();

      res.status(200).json({ success: true, order });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  } else {
    res.setHeader("Allow", ["PUT"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }

 if (req.method === "GET") {
    try {
      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.status(200).json(product);
    } catch (err) {
      console.error("GET /api/products/:id failed", err);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
