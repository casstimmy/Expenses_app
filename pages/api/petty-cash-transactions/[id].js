import { mongooseConnect } from "@/lib/mongoose";
import { requireAuth } from "@/lib/auth";
import {
  buildApprovalHistoryEntry,
  buildStaffSnapshot,
  recalculateDailyCashForLocation,
  syncPettyCashExpense,
} from "@/lib/petty-cash-transactions";
import PettyCashTransaction from "@/models/PettyCashTransaction";

const APPROVER_ROLES = ["admin", "Senior staff", "account"];

function canApprove(staff) {
  return APPROVER_ROLES.includes(staff?.role);
}

function parseDate(value, fallback = null) {
  if (!value) return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export default async function handler(req, res) {
  const authStaff = await requireAuth(req, res);
  if (!authStaff) return;

  await mongooseConnect();

  const { id } = req.query;

  if (req.method !== "PUT") {
    res.setHeader("Allow", ["PUT"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const transaction = await PettyCashTransaction.findById(id);
    if (!transaction) {
      return res.status(404).json({ error: "Petty cash transaction not found." });
    }

    const { action, note = "", paymentMethod = "", paymentReference = "", paidAt } = req.body || {};
    const fromStatus = transaction.status;
    const previousLocation = transaction.location;

    if (!action) {
      return res.status(400).json({ error: "Action is required." });
    }

    if (["approve", "reject", "mark-paid", "cancel", "reopen"].includes(action) && !canApprove(authStaff)) {
      return res.status(403).json({ error: "You do not have permission to perform this action." });
    }

    if (action === "approve") {
      transaction.status = "Approved";
      transaction.approvedAt = new Date();
      transaction.approvedBy = buildStaffSnapshot(authStaff);
    } else if (action === "reject") {
      transaction.status = "Rejected";
      transaction.paidAt = null;
      transaction.paidBy = null;
      transaction.paymentMethod = "";
      transaction.paymentReference = "";
    } else if (action === "mark-paid") {
      if (!["Approved", "Paid"].includes(transaction.status)) {
        return res.status(400).json({
          error: "Only approved petty cash transactions can be marked as paid.",
        });
      }

      transaction.status = "Paid";
      transaction.paidAt = parseDate(paidAt, new Date()) || new Date();
      transaction.paidBy = buildStaffSnapshot(authStaff);
      transaction.paymentMethod = paymentMethod || transaction.paymentMethod || "transfer";
      transaction.paymentReference = paymentReference || transaction.paymentReference || "";
    } else if (action === "cancel") {
      if (transaction.status === "Paid") {
        return res.status(400).json({
          error: "Paid petty cash transactions cannot be cancelled directly.",
        });
      }
      transaction.status = "Cancelled";
    } else if (action === "reopen") {
      transaction.status = "Pending Approval";
      transaction.paidAt = null;
      transaction.paidBy = null;
      transaction.paymentMethod = "";
      transaction.paymentReference = "";
    } else {
      return res.status(400).json({ error: "Unsupported action." });
    }

    transaction.approvalHistory.push(
      buildApprovalHistoryEntry({
        action,
        fromStatus,
        toStatus: transaction.status,
        note,
        staff: authStaff,
        amount: transaction.amount,
        paymentMethod: transaction.paymentMethod,
        paymentReference: transaction.paymentReference,
      })
    );

    const expenseId = await syncPettyCashExpense(transaction);
    transaction.expense = expenseId;
    await transaction.save();

    if (fromStatus === "Paid" || transaction.status === "Paid") {
      await recalculateDailyCashForLocation(previousLocation);
      if (transaction.location !== previousLocation) {
        await recalculateDailyCashForLocation(transaction.location);
      }
    }

    await transaction.populate("vendor");
    await transaction.populate("expense");

    return res.status(200).json({ success: true, transaction });
  } catch (error) {
    console.error("Petty cash transaction update error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to update petty cash transaction",
    });
  }
}