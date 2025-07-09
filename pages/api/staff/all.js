import { mongooseConnect } from "@/lib/mongoose";
import { Staff } from "@/models/Staff";

export default async function handler(req, res) {
  await mongooseConnect();

  if (req.method === "GET") {
    try {
      const staffList = await Staff.find({}, "name location role"); // <-- include fields
      res.status(200).json(staffList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch staff." });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
