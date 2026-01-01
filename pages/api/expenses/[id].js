// ...existing code...
import mongoose from "mongoose";
import { mongooseConnect } from "@/lib/mongoose";
import Expense from "@/models/Expense";

export default async function handler(req, res) {
  await mongooseConnect();
  const { id } = req.query;

  try {
    // log incoming request for debugging
    console.log(`API /api/expenses/${id} ${req.method} - body:`, req.body);

    switch (req.method) {
      // ---------------------------
      // GET — Fetch single expense
      // ---------------------------
      case "GET": {
        const expense = await Expense.findById(id).populate("category", "name");
        if (!expense) return res.status(404).json({ error: "Expense not found" });
        return res.status(200).json(expense);
      }

      // ---------------------------
      // PUT — Update an expense (ensure date/createdAt update)
      // ---------------------------
      case "PUT": {
        const {
          title,
          amount,
          category,
          description,
          location,
          staffName, // optional staff name sent from client
          createdAt, // optional full ISO date/time
          date, // optional date (YYYY-MM-DD)
        } = req.body;

        // validate required fields (allow 0)
        if (!title || amount === undefined || amount === null || !category) {
          return res.status(400).json({ error: "Title, amount, and category are required." });
        }

        // Try to find existing by id (works for ObjectId strings and custom _id)
        const existingExpense = await Expense.findOne({ _id: id }).lean();
        console.log("existingExpense (find):", existingExpense);
        if (!existingExpense) {
          return res.status(404).json({ error: "Expense not found" });
        }

        // Parse incoming date (createdAt or date)
        const incoming = createdAt ?? date;
        let parsedDate = null;
        if (incoming) {
          const d = new Date(incoming);
          if (isNaN(d.getTime())) {
            return res.status(400).json({ error: "Invalid date format" });
          }
          parsedDate = d;
        }

        // Build update ($set) only for fields provided / required
        const setObj = {
          title: String(title).trim(),
          amount: Number(amount),
          category,
          description: description || "",
          location: location ?? existingExpense.location ?? null,
        };

        if (parsedDate) {
          // set both explicit date and createdAt (timestamps.createdAt)
          setObj.date = parsedDate;
          setObj.createdAt = parsedDate;
        }

        // handle staff name update safely
        if (staffName) {
          // preserve existing staff._id if present
          if (existingExpense.staff && typeof existingExpense.staff === "object" && existingExpense.staff._id) {
            setObj["staff"] = { ...existingExpense.staff, name: staffName };
          } else {
            setObj["staff"] = { name: staffName };
          }
        }

        const update = { $set: setObj };
        console.log("Computed update object:", update);

        // Use findOneAndUpdate to handle string ids and return the updated document
        const updated = await Expense.findOneAndUpdate(
          { _id: id },
          update,
          {
            new: true,
            runValidators: true,
            context: "query",
          }
        ).populate("category", "name");

        console.log("Updated doc returned from DB:", updated);
        if (!updated) return res.status(404).json({ error: "Expense not found" });

        return res.status(200).json(updated);
      }

      // ---------------------------
      // DELETE — Remove expense
      // ---------------------------
      case "DELETE": {
        const deleted = await Expense.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ error: "Expense not found" });
        return res.status(200).json({ message: "Expense deleted", id });
      }

      // ---------------------------
      // Invalid Method
      // ---------------------------
      default:
        res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (err) {
    console.error(`❌ [${req.method}] /api/expenses/${id}:`, err);
    return res.status(500).json({
      error: `Failed to ${req.method.toLowerCase()} expense.`,
      details: err.message,
    });
  }
}
// ...existing code...