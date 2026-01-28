// pages/api/stock-orders/cron.js
import { mongooseConnect } from "@/lib/mongoose";
import StockOrder from "@/models/StockOrder";
import { sendMail } from "@/lib/mailer";

export default async function handler(req, res) {
  try {
    // Auth check for production
    if (process.env.NODE_ENV === "production") {
      // Debug logging for troubleshooting
      const key = req.query.key;
      console.log("[CRON DEBUG] Received key:", key);
      console.log("[CRON DEBUG] Server CRON_SECRET:", process.env.CRON_SECRET);
      if (key && key === process.env.CRON_SECRET) {
        // Allow
      } else {
        const auth = req.headers.authorization;
        console.log("[CRON DEBUG] Received Authorization header:", auth);
        if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
          console.log("[CRON DEBUG] 401 Unauthorized triggered");
          return res.status(401).send("Unauthorized");
        }
      }
    }

    if (req.method !== "POST" && req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    console.log('[MAIL DEBUG] Connecting to MongoDB...');
    await mongooseConnect();
    console.log('[MAIL DEBUG] Connected to MongoDB.');

    const { FROM_EMAIL, REMINDER_EMAIL } = process.env;
    console.log('[MAIL DEBUG] ENV:', { FROM_EMAIL, REMINDER_EMAIL });
    if (!FROM_EMAIL) {
      console.log('[MAIL DEBUG] Missing FROM_EMAIL');
      return res.status(500).json({
        error: "Missing FROM_EMAIL in .env",
      });
    }

    const allOrders = await StockOrder.find();
    console.log('[MAIL DEBUG] StockOrder count:', allOrders.length);
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

    console.log('[MAIL DEBUG] Overdue orders count:', overdueOrders.length);
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

    const reminderEmailTo = REMINDER_EMAIL || "cass2artclassic@gmail.com";

    console.log("📧 Sending overdue orders reminder via Nodemailer to:", reminderEmailTo);
    try {
      const emailResponse = await sendMail({
        from: FROM_EMAIL,
        to: reminderEmailTo,
        subject: "⚠️ Overdue Vendor Orders",
        html: mailHtml,
      });
      console.log("✅ Email sent successfully:", emailResponse.messageId);
      return res.status(200).json({
        message: "Overdue orders reminder sent successfully via Nodemailer.",
        orderCount: overdueOrders.length,
        sentTo: reminderEmailTo,
        messageId: emailResponse.messageId,
      });
    } catch (error) {
      console.error("❌ Nodemailer error:", error);
      return res.status(500).json({
        error: "Failed to send reminder email",
        details: error.message,
      });
    }
  } catch (err) {
    console.error("❌ Error sending reminder email:", err);
    return res.status(500).json({
      error: "Failed to send reminder email",
      message: err.message,
      hint: "Check EMAIL_USER/EMAIL_PASS configuration and ensure you have enabled Gmail app password",
    });
  }
}
