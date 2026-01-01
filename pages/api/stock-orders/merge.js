import { mongooseConnect } from "@/lib/mongoose";
import StockOrder from "@/models/StockOrder";

export default async function handler(req, res) {
  await mongooseConnect();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // ✅ Get staff from the frontend request
    const { staff } = req.body;
    if (!staff) {
      return res.status(400).json({ error: "Staff information is required." });
    }

    // Fetch all stock orders
    const orders = await StockOrder.find({ $or: [{ reason: { $exists: false } }, { reason: "" }] });

    if (orders.length === 0) {
      return res.status(200).json({
        success: true,
        mergedCount: 0,
        message: "No orders found",
      });
    }

    const mergedMap = {};

    for (const order of orders) {
      const key = `${order.vendor}|${order.supplier}`;

      if (!mergedMap[key]) {
        mergedMap[key] = {
          supplier: order.supplier,
          contact: order.contact,
          mainProduct: order.mainProduct,
          vendor: order.vendor,
          staff,
          productsMap: {},
          _ids: [],
        };
      }

      for (const product of order.products) {
        if (!product.name) continue; // ✅ Skip invalid products safely

        const name = product.name;
        const quantity = Number(product.quantity) || 0;
        const price = Number(product.price) || 0;

        if (!mergedMap[key].productsMap[name]) {
          mergedMap[key].productsMap[name] = {
            name,
            quantity: 0,
            price,
          };
        }

        mergedMap[key].productsMap[name].quantity += quantity;
      }

      mergedMap[key]._ids.push(order._id);
    }

    const mergedOrders = Object.values(mergedMap);
    const mergedDocs = [];
    const allMergedIds = [];

    for (const entry of mergedOrders) {
      const mergedProducts = Object.values(entry.productsMap).map((p) => ({
        name: p.name,
        quantity: p.quantity,
        price: p.price,
        total: Number(p.quantity) * Number(p.price),
      }));

      const grandTotal = mergedProducts.reduce(
        (sum, p) => sum + (p.total || 0),
        0
      );

      mergedDocs.push({
        date: new Date(),
        supplier: entry.supplier,
        contact: entry.contact,
        mainProduct: entry.mainProduct,
        vendor: entry.vendor,
        staff: entry.staff,
        products: mergedProducts,
        grandTotal,
        location: "All Locations (Merged by Vendor)",
      });

      allMergedIds.push(...entry._ids);
    }

    await StockOrder.insertMany(mergedDocs);
    await StockOrder.deleteMany({ _id: { $in: allMergedIds } });

    console.log(`✅ Successfully merged ${mergedOrders.length} order groups`);
    res.status(200).json({ success: true, mergedCount: mergedOrders.length });
  } catch (err) {
    console.error("❌ Merge failed:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
}


