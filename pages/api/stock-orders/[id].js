// /api/stock-orders/[id].js

import { mongooseConnect } from "@/lib/mongoose";
import StockOrder from "@/models/StockOrder";

export default async function handler(req, res) {
  const { id } = req.query;

  await mongooseConnect();

  if (req.method === "GET") {
    try {
      const order = await StockOrder.findById(id).populate("vendor");
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      const orderObj = order.toObject();

      return res.status(200).json({ order: orderObj });
    } catch (error) {
      console.error("Fetch failed:", error);
      return res.status(500).json({ error: "Failed to fetch order." });
    }
  }

  if (req.method === "PUT") {
    try {
      const updated = await StockOrder.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
      });

      if (!updated) {
        return res.status(404).json({ error: "Order not found" });
      }

      return res.status(200).json({ success: true, order: updated });
    } catch (error) {
      console.error("Update failed:", error);
      return res.status(500).json({ error: "Failed to update order." });
    }
  }

  if (req.method === "DELETE") {
    try {
      await StockOrder.findByIdAndDelete(id);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Delete failed:", error);
      return res.status(500).json({ error: "Failed to delete order." });
    }
  }

  res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
