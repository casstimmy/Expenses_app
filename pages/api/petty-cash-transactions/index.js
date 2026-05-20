import { mongooseConnect } from "@/lib/mongoose";
import { requireAuth } from "@/lib/auth";
import {
  buildApprovalHistoryEntry,
  buildStaffSnapshot,
} from "@/lib/petty-cash-transactions";
import PettyCashTransaction from "@/models/PettyCashTransaction";
import Vendor from "@/models/Vendor";

function parseDate(value, fallback = null) {
  if (!value) return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export default async function handler(req, res) {
  const authStaff = await requireAuth(req, res);
  if (!authStaff) return;

  await mongooseConnect();

  if (req.method === "GET") {
    try {
      const { vendorId, status, location } = req.query;
      const filter = {};

      if (vendorId) filter.vendor = vendorId;
      if (status) filter.status = status;
      if (location) filter.location = location;

      const transactions = await PettyCashTransaction.find(filter)
        .populate("vendor")
        .populate("expense")
        .sort({ createdAt: -1 });

      return res.status(200).json(transactions);
    } catch (error) {
      console.error("Petty cash transaction fetch error:", error);
      return res.status(500).json({ error: "Failed to fetch petty cash transactions" });
    }
  }

  if (req.method === "POST") {
    try {
      const { vendor: vendorId, purpose, description, amount, location, requestDate, neededBy } =
        req.body || {};

      if (!vendorId || !purpose || amount === undefined || !location || !requestDate) {
        return res.status(400).json({
          error: "Vendor, purpose, amount, location, and request date are required.",
        });
      }

      const vendor = await Vendor.findById(vendorId);
      if (!vendor || vendor.vendorType !== "petty-cash") {
        return res.status(400).json({ error: "Petty cash vendor not found." });
      }

      const transaction = await PettyCashTransaction.create({
        vendor: vendor._id,
        vendorName: vendor.companyName,
        purpose: String(purpose).trim(),
        description: typeof description === "string" ? description.trim() : "",
        amount: Number(amount),
        location: String(location).trim(),
        requestDate: parseDate(requestDate, new Date()),
        neededBy: parseDate(neededBy, null),
        status: "Pending Approval",
        requestedBy: buildStaffSnapshot(authStaff),
        approvalHistory: [
          buildApprovalHistoryEntry({
            action: "created",
            toStatus: "Pending Approval",
            note: typeof description === "string" ? description : "",
            staff: authStaff,
            amount,
          }),
        ],
      });

      await transaction.populate("vendor");

      return res.status(201).json({ success: true, transaction });
    } catch (error) {
      console.error("Petty cash transaction create error:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to create petty cash transaction",
      });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}