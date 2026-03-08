import { mongooseConnect } from "@/lib/mongoose";
import Project from "@/models/Project";
import { requireAuth } from "@/lib/auth";

export default async function handler(req, res) {
  await mongooseConnect();

  // GET is public
  if (req.method === "GET") {
    try {
      const projects = await Project.find().sort({ createdAt: -1 });
      return res.status(200).json(projects);
    } catch (err) {
      console.error("Fetch projects error:", err);
      return res.status(500).json({ message: "Failed to fetch projects" });
    }
  }

  // POST requires auth
  const staff = await requireAuth(req, res, ["admin", "Senior staff"]);
  if (!staff) return;

  if (req.method === "POST") {
    const { name, description, startDate, totalDays, categories } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Project name is required" });
    }

    try {
      const project = await Project.create({
        name,
        description,
        startDate: startDate || new Date(),
        totalDays: totalDays || 7,
        categories: categories || [],
        createdBy: staff.name,
      });
      return res.status(201).json(project);
    } catch (err) {
      console.error("Create project error:", err);
      return res.status(500).json({ message: "Failed to create project" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
