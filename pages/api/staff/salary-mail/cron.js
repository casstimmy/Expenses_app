import { mongooseConnect } from "@/lib/mongoose";
import { sendMail } from "@/lib/mailer";
import path from "path";
import fs from "fs";
import { Staff } from "@/models/Staff";

export default async function handler(req, res) {



  // 1. Auth check (before DB connection)
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

    // 2. Check method first
    if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 3. Check schedule
  const forceSend = req.query.force === "true";
  const today = new Date();
  const isTargetDate = today.getDate() === 11 && today.getHours() === 12;

  if (!forceSend && !isTargetDate) {
    return res.status(200).json({
      message: "Not the scheduled date/time, skipping email.",
      nextRun: `11th of month at 12:00 (or use ?force=true to send now)`,
    });
  }

  try {
    console.log('[MAIL DEBUG] Connecting to MongoDB...');
    await mongooseConnect();
    console.log('[MAIL DEBUG] Connected to MongoDB.');

    // 4. Validate required env vars
    const { RESEND_API_KEY, FROM_EMAIL, SALARY_MAIL_TO, SALARY_MAIL_CC } = process.env;
    console.log('[MAIL DEBUG] ENV:', { RESEND_API_KEY: !!RESEND_API_KEY, FROM_EMAIL, SALARY_MAIL_TO, SALARY_MAIL_CC });

    if (!RESEND_API_KEY) {
      console.log('[MAIL DEBUG] Missing RESEND_API_KEY');
      return res.status(500).json({
        error: "Missing RESEND_API_KEY in .env",
        hint: "Get your API key from https://resend.com/api-keys",
      });
    }

    if (!FROM_EMAIL) {
      console.log('[MAIL DEBUG] Missing FROM_EMAIL');
      return res.status(500).json({
        error: "Missing FROM_EMAIL in .env",
      });
    }

    if (!SALARY_MAIL_TO) {
      console.log('[MAIL DEBUG] Missing SALARY_MAIL_TO');
      return res.status(500).json({
        error: "Missing SALARY_MAIL_TO in .env",
      });
    }



    // 7. Fetch staff
    const staffList = await Staff.find({});
    console.log('[MAIL DEBUG] Staff count:', staffList.length);
    if (!staffList || staffList.length === 0) {
      console.log('[MAIL DEBUG] No staff records found');
      return res.status(400).json({ error: "No staff records found" });
    }

    const currentMonth = new Date().toLocaleString("default", {
      month: "long",
    });
    const currentYear = new Date().getFullYear();

    // 8. Calculate total net salary
    const totalNetSalary = staffList.reduce((sum, staff) => {
      const totalPenalty = (staff.penalty || []).reduce(
        (penSum, p) => penSum + (p.amount || 0),
        0
      );
      const net = (staff.salary || 0) - totalPenalty;
      return sum + net;
    }, 0);

    const formattedTotal = Number(totalNetSalary || 0).toLocaleString();

    // 9. Build table rows
    const tableRows = staffList
      .map((staff) => {
        const totalPenalty = (staff.penalty || []).reduce(
          (sum, p) => sum + (p.amount || 0),
          0
        );
        const netSalary = Number(
          (staff.salary || 0) - totalPenalty
        ).toLocaleString();

        return `
          <tr>
            <td style="border:1px solid #ddd;padding:8px;">${staff.name}</td>
            <td style="border:1px solid #ddd;padding:8px;">${
              staff.bank?.accountName || "N/A"
            }</td>
            <td style="border:1px solid #ddd;padding:8px;">${
              staff.bank?.accountNumber || "N/A"
            }</td>
            <td style="border:1px solid #ddd;padding:8px;">${
              staff.bank?.bankName || "N/A"
            }</td>
            <td style="border:1px solid #ddd;padding:8px;text-align:right;">₦${netSalary}</td>
          </tr>
        `;
      })
      .join("");



    const mailHtml = `
  <div style="font-family:'Segoe UI',Roboto,sans-serif;background:#f0f4f8;padding:30px;">
    <div style="max-width:700px;margin:auto;background:#ffffff;padding:40px 30px;border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,0.1);border:1px solid #e1e1e1;">
      
      <!-- Title -->
      <h2 style="text-align:center;color:#003366;font-size:22px;margin-bottom:10px;">Salary Payment Schedule</h2>
      <p style="text-align:center;color:#555;font-size:15px;margin-bottom:30px;">
        <strong>${currentMonth} ${currentYear}</strong>
      </p>

      <!-- Intro -->
      <p style="font-size:14px;color:#444;line-height:1.6;margin-bottom:30px;">
        Dear Sir,<br><br>
        Please find below the salary schedule for the month of <strong>${currentMonth} ${currentYear}</strong>. Kindly review and proceed accordingly.
      </p>

      <!-- Table -->
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead style="background:#25476a;color:#fff;">
          <tr>
            <th style="border:1px solid #ccc;padding:10px;text-align:left;">Staff Name</th>
            <th style="border:1px solid #ccc;padding:10px;text-align:left;">Account Name</th>
            <th style="border:1px solid #ccc;padding:10px;text-align:left;">Bank Account</th>
            <th style="border:1px solid #ccc;padding:10px;text-align:left;">Bank Name</th>
            <th style="border:1px solid #ccc;padding:10px;text-align:right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
          <tr style="background:#f1f1f1;font-weight:bold;">
            <td colspan="4" style="border:1px solid #ccc;padding:10px;text-align:right;">Total</td>
            <td style="border:1px solid #ccc;padding:10px;text-align:right;">₦${formattedTotal}</td>
          </tr>
        </tbody>
      </table>

      <!-- Footer -->
      <p style="font-size:12px;color:#999;text-align:center;margin-top:40px;">
        Powered by Hetch Tech (Ayoola).<br/>
        &copy; ${new Date().getFullYear()} Ibile Trading Resources Limited. All rights reserved.
      </p>
    </div>
  </div>
`;

    // 10. Build mail options
    const mailOptions = {
      from: FROM_EMAIL,
      to: SALARY_MAIL_TO,
      ...(SALARY_MAIL_CC && { cc: SALARY_MAIL_CC }),
      subject: `${currentMonth} ${currentYear} Salary Schedule`,
      html: mailHtml,
    };

    // 11. Send email via Nodemailer
    console.log("[MAIL DEBUG] Sending salary email via Nodemailer to:", SALARY_MAIL_TO);
    try {
      const emailResponse = await sendMail(mailOptions);
      console.log("✅ Email sent successfully:", emailResponse.messageId);
      return res.status(200).json({
        message: "Salary email sent successfully via Nodemailer.",
        staffCount: staffList.length,
        totalSalary: formattedTotal,
        sentTo: SALARY_MAIL_TO,
        messageId: emailResponse.messageId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Nodemailer error:", error);
      return res.status(500).json({
        error: "Failed to send salary email",
        details: error.message,
      });
    }
  } catch (err) {
    console.error("❌ Error sending salary email:", err);
    return res.status(500).json({
      error: "Failed to send salary email",
      message: err.message,
      hint: "Check EMAIL_USER/EMAIL_PASS configuration and ensure you have enabled Gmail app password",
    });
  }
}