// pages/api/cron.js
import { mongooseConnect } from "@/lib/mongoose";
import StockOrder from "@/models/StockOrder";
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  try {
    // Auth check for production
    if (process.env.NODE_ENV === "production") {
      const auth = req.headers.authorization;
      if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).send("Unauthorized");
      }
    }

    if (req.method !== "POST" && req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    await mongooseConnect();

    const { EMAIL_USER, EMAIL_PASS } = process.env;
    if (!EMAIL_USER || !EMAIL_PASS) {
      return res.status(500).json({ error: "Missing email credentials" });
    }

    // Gmail SMTP — use App Password if 2FA is enabled
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS, // App Password here
      },
    });

    const allOrders = await StockOrder.find();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueOrders = allOrders.filter((order) => {
      if (!order.date) return false;

      const statusMatch =
        order.status === "Not Paid" || order.status === "Partly Paid";

      if (!statusMatch) return false;

      const createdAt = new Date(order.date);
      const dueDate = new Date(createdAt);
      dueDate.setDate(dueDate.getDate() + 14);
      dueDate.setHours(0, 0, 0, 0);

      return dueDate < today;
    });

    if (overdueOrders.length === 0) {
      return res.status(200).json({ message: "No overdue orders to email." });
    }

    const mailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: #f9f9f9;">
        <h2 style="color: red;">🚨 Overdue Orders</h2>
        ${overdueOrders
          .map(
            (order) => `
          <div style="background: white; padding: 15px; margin-bottom: 10px; border-left: 4px solid red;">
            <p><b>Supplier:</b> ${order.supplier}</p>
            <p><b>Date:</b> ${new Date(order.date).toLocaleDateString()}</p>
            <p><b>Main Product:</b> ${order.mainProduct}</p>
            <p><b>Total:</b> ₦${order.grandTotal?.toLocaleString()}</p>
          </div>
        `
          )
          .join("")}
      </div>
    `;

    await transporter.sendMail({
      from: `"Stock Reminder" <${EMAIL_USER}>`,
      to: process.env.REMINDER_EMAIL || "cass2artclassic@gmail.com",
      subject: "⚠️ Overdue Vendor Orders",
      html: mailHtml,
    });

    return res.status(200).json({ message: "Email sent successfully." });
  } catch (err) {
    console.error("❌ Error sending reminder email:", err);
    return res.status(500).json({ error: err.message });
  }
}
