import { mongooseConnect } from "@/lib/mongoose";
import Asset from "@/models/Asset";
import { requireAuth } from "@/lib/auth";

export default async function handler(req, res) {
  const { id } = req.query;
  await mongooseConnect();

  // GET is public (no auth)
  if (req.method === "GET") {
    try {
      const asset = await Asset.findById(id);
      if (!asset) return res.status(404).json({ message: "Asset not found" });
      return res.status(200).json(asset);
    } catch (err) {
      return res.status(500).json({ message: "Server error" });
    }
  }

  // PUT/DELETE require auth
  const staff = await requireAuth(req, res);
  if (!staff) return;

  if (req.method === "PUT") {
    const { name, image, description, location, category, status, statusNote } = req.body;

    try {
      const asset = await Asset.findById(id);
      if (!asset) return res.status(404).json({ message: "Asset not found" });

      if (name) asset.name = name;
      if (image) asset.image = image;
      if (description !== undefined) asset.description = description;
      if (location) asset.location = location;
      if (category !== undefined) asset.category = category;

      if (status && status !== asset.status) {
        asset.statusHistory.push({
          status,
          note: statusNote || "",
          date: new Date(),
        });
        asset.status = status;
      }

      await asset.save();
      return res.status(200).json(asset);
    } catch (err) {
      console.error("Update asset error:", err);
      return res.status(500).json({ message: "Failed to update asset" });
    }
  }

  if (req.method === "DELETE") {
    try {
      await Asset.findByIdAndDelete(id);
      return res.status(200).json({ message: "Asset deleted" });
    } catch (err) {
      return res.status(500).json({ message: "Failed to delete asset" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
