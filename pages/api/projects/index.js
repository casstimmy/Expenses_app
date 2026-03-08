import { mongooseConnect } from "@/lib/mongoose";
import Project from "@/models/Project";
import { requireAuth, getAuthStaff } from "@/lib/auth";

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

  if (req.method === "POST") {
    const { name, description, startDate, totalDays, categories, assignedTo, guestName } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Project name is required" });
    }

    // Try auth — if logged in use staff name, otherwise require guestName
    const staff = await getAuthStaff(req);
    const createdBy = staff ? staff.name : (guestName || "Guest");

    try {
      const project = await Project.create({
        name,
        description,
        startDate: startDate || new Date(),
        totalDays: totalDays || 7,
        categories: categories || [],
        assignedTo: assignedTo || "",
        createdBy,
      });
      return res.status(201).json(project);
    } catch (err) {
      console.error("Create project error:", err);
      return res.status(500).json({ message: "Failed to create project" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
