import { mongooseConnect } from "@/lib/mongoose";
import Asset from "@/models/Asset";
import { requireAuth } from "@/lib/auth";

export default async function handler(req, res) {
  const staff = await requireAuth(req, res);
  if (!staff) return;

  await mongooseConnect();

  if (req.method === "GET") {
    try {
      const assets = await Asset.find().sort({ createdAt: -1 });
      return res.status(200).json(assets);
    } catch (err) {
      console.error("Fetch assets error:", err);
      return res.status(500).json({ message: "Failed to fetch assets" });
    }
  }

  if (req.method === "POST") {
    const { name, image, description, location, category, status } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Asset name is required" });
    }

    try {
      const asset = await Asset.create({
        name,
        image,
        description,
        location,
        category,
        status: status || "Active",
        statusHistory: [{ status: status || "Active", note: "Asset created" }],
        addedBy: staff.name,
      });
      return res.status(201).json(asset);
    } catch (err) {
      console.error("Create asset error:", err);
      return res.status(500).json({ message: "Failed to create asset" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
