import { mongooseConnect } from "@/lib/mongoose";
import StockOrder from "@/models/StockOrder";

export default async function handler(req, res) {
  await mongooseConnect();

  const { id } = req.query;

  if (req.method === "PUT") {
    try {
      const { paymentMade, paymentDate, status, balance } = req.body;

      const updated = await StockOrder.findByIdAndUpdate(
        id,
        {
          paymentMade,
          paymentDate,
          status,
          balance,
        },
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: "Order not found" });
      }

      res.status(200).json({ success: true, order: updated });
    } catch (error) {
      console.error("Payment update failed:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  } else if (req.method === "DELETE") {
    try {
      const deleted = await StockOrder.findByIdAndDelete(id);

      if (!deleted) {
        return res.status(404).json({ success: false, message: "Order not found" });
      }

      res.status(200).json({ success: true, message: "Order deleted successfully" });
    } catch (error) {
      console.error("Delete failed:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  } else {
    res.setHeader("Allow", ["PUT", "DELETE"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
