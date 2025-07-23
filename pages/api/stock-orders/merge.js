// /pages/api/stock-orders/merge.js
import { mongooseConnect } from "@/lib/mongoose";
import StockOrder from "@/models/StockOrder";

export default async function handler(req, res) {
  await mongooseConnect();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const today = new Date().toISOString().split("T")[0];
    const orders = await StockOrder.find({ date: today });

    const mergedMap = {};

    for (const order of orders) {
      const key = `${order.date}|${order.supplier}|${order.mainProduct}`;

      if (!mergedMap[key]) {
        mergedMap[key] = {
          date: order.date,
          supplier: order.supplier,
          contact: order.contact,
          mainProduct: order.mainProduct,
          vendor: order.vendor, // ✅ Include vendor
          productsMap: {},
          _ids: [],
        };
      }

      for (const product of order.products) {
        const name = product.product;

        const quantity = Number(product.quantity) || 0;
        const costPrice = Number(product.costPrice) || 0;

        if (!mergedMap[key].productsMap[name]) {
          mergedMap[key].productsMap[name] = {
            product: name,
            quantity: 0,
            costPrice: costPrice,
          };
        }

        mergedMap[key].productsMap[name].quantity += quantity;
      }

      mergedMap[key]._ids.push(order._id);
    }

    const mergedOrders = Object.values(mergedMap);
    for (const entry of mergedOrders) {
      const mergedProducts = Object.values(entry.productsMap).map((p) => {
        const total = Number(p.quantity) * Number(p.costPrice);
        return {
          ...p,
          total: isNaN(total) ? 0 : total, // ✅ Handle NaN safely
        };
      });

      const grandTotal = mergedProducts.reduce((sum, p) => sum + (p.total || 0), 0);

      await StockOrder.create({
        date: entry.date,
        supplier: entry.supplier,
        contact: entry.contact,
        mainProduct: entry.mainProduct,
        vendor: entry.vendor || "Unknown", // ✅ Ensure vendor is provided
        products: mergedProducts,
        grandTotal,
        location: "All Locations (Merged)",
      });

      await StockOrder.deleteMany({ _id: { $in: entry._ids } });
    }

    res.status(200).json({ success: true, mergedCount: mergedOrders.length });
  } catch (err) {
    console.error("Merge failed:", err);
    res.status(500).json({ error: "Server error" });
  }
}
