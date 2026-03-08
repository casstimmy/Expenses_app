import { mongooseConnect } from "@/lib/mongoose";
import Project from "@/models/Project";
import { requireAuth } from "@/lib/auth";

export default async function handler(req, res) {
  const { id } = req.query;
  await mongooseConnect();

  // GET is public
  if (req.method === "GET") {
    try {
      const project = await Project.findById(id);
      if (!project) return res.status(404).json({ message: "Project not found" });
      return res.status(200).json(project);
    } catch (err) {
      return res.status(500).json({ message: "Server error" });
    }
  }

  // PUT/DELETE require admin/senior
  const staff = await requireAuth(req, res, ["admin", "Senior staff"]);
  if (!staff) return;

  if (req.method === "PUT") {
    const { name, description, status, startDate, totalDays, categories } = req.body;

    try {
      const project = await Project.findById(id);
      if (!project) return res.status(404).json({ message: "Project not found" });

      if (name) project.name = name;
      if (description !== undefined) project.description = description;
      if (status) project.status = status;
      if (startDate) project.startDate = startDate;
      if (totalDays) project.totalDays = totalDays;
      if (categories) project.categories = categories;

      await project.save();
      return res.status(200).json(project);
    } catch (err) {
      console.error("Update project error:", err);
      return res.status(500).json({ message: "Failed to update project" });
    }
  }

  if (req.method === "DELETE") {
    try {
      await Project.findByIdAndDelete(id);
      return res.status(200).json({ message: "Project deleted" });
    } catch (err) {
      return res.status(500).json({ message: "Failed to delete project" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
