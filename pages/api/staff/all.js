import { mongooseConnect } from "@/lib/mongoose";
import { Staff } from "@/models/Staff";
import { requireAuth } from "@/lib/auth";

export default async function handler(req, res) {
  // Admin + Senior staff only
  const authStaff = await requireAuth(req, res, ["admin", "Senior staff", "account"]);
  if (!authStaff) return;

  await mongooseConnect();

  if (req.method === "GET") {
    try {
      const staffList = await Staff.find({});

      res.status(200).json(staffList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch staff." });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
