// pages/api/cron.js
import { mongooseConnect } from "@/lib/mongoose";
import StockOrder from "@/models/StockOrder";
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  const auth = req.headers.authorization;

  // Only check auth in production
  if (process.env.NODE_ENV === "production" && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).send("Unauthorized");
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await mongooseConnect();


    const { EMAIL_USER, EMAIL_PASS } = process.env;
    if (!EMAIL_USER || !EMAIL_PASS) {
      console.error("❌ Missing EMAIL_USER or EMAIL_PASS in environment.");
      return res.status(500).json({ error: "Missing email credentials" });
    }

    const allOrders = await StockOrder.find();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueOrders = allOrders.filter((order) => {
      if (!order.createdAt || order.status === "fulfilled") return false;

      const createdAt = new Date(order.createdAt);
      const dueDate = new Date(createdAt);
      dueDate.setDate(dueDate.getDate() + 14);
      dueDate.setHours(0, 0, 0, 0);

      return dueDate < today;
    });



    if (overdueOrders.length === 0) {
      return res.status(200).json({ message: "No overdue orders to email." });
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });



    const mailHtml = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f4f8; padding: 30px;">
      <div style="max-width: 700px; margin: auto;">
        <h2 style="color: #d63031; text-align: center; margin-bottom: 30px;">🚨 Overdue Order Payments</h2>
        ${overdueOrders
          .map((order) => {
            return `
              <div style="background-color: #ffffff; border-radius: 10px; padding: 20px 25px; margin-bottom: 25px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border-left: 6px solid #333;">
                <p><strong>📦 Supplier:</strong> ${order.supplier || "N/A"}</p>
                <p><strong>📞 Contact:</strong> ${order.contact || "N/A"}</p>
                <p><strong>📅 Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
                <p><strong>🧾 Main Product:</strong> ${order.mainProduct || "N/A"}</p>
                <p><strong>💰 Total:</strong> ₦${order.grandTotal?.toLocaleString() || "0"}</p>
              </div>
            `;
          })
          .join("")}
        <p style="text-align: center; font-size: 0.9em; color: #7f8c8d; margin-top: 40px;">
          This is an automated reminder sent from your inventory system.
        </p>
      </div>
    </div>
    `;

    try {
      await transporter.sendMail({
        from: `"Stock Reminder" <${EMAIL_USER}>`,
        to: "cass2artclassic@gmail.com",
        subject: "⚠️ Overdue Vendor Orders",
        html: mailHtml,
      });

      return res.status(200).json({ message: "Email sent successfully!" });
    } catch (mailErr) {
      console.error("❌ Email sending error:", mailErr.message);
      console.error(mailErr.stack);
      return res.status(500).json({ error: "Failed to send email", details: mailErr.message });
    }
  } catch (err) {
    console.error("❌ General cron error:", err.message);
    console.error(err.stack);
    return res.status(500).json({ error: "Failed to run cron job", details: err.message });
  }
}
