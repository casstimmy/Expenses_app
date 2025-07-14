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
          productsMap: {}, // for merging products
          _ids: [],
        };
      }

      for (const product of order.products) {
        const name = product.product;

        if (!mergedMap[key].productsMap[name]) {
          mergedMap[key].productsMap[name] = {
            product: name,
            quantity: 0,
            costPerUnit: product.costPerUnit,
          };
        }

        mergedMap[key].productsMap[name].quantity += product.quantity;
      }

      mergedMap[key]._ids.push(order._id);
    }

    // Process each merged group and insert
    const mergedOrders = Object.values(mergedMap);
    for (const entry of mergedOrders) {
      const mergedProducts = Object.values(entry.productsMap).map((p) => ({
        ...p,
        total: p.quantity * p.costPerUnit,
      }));

      const grandTotal = mergedProducts.reduce(
        (sum, p) => sum + p.total,
        0
      );

      await StockOrder.create({
        date: entry.date,
        supplier: entry.supplier,
        contact: entry.contact,
        mainProduct: entry.mainProduct,
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
