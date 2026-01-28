import { mongooseConnect } from "@/lib/mongoose";
import { sendMail } from "@/lib/mailer";
import { Staff } from "@/models/Staff";

export default async function handler(req, res) {
  // 1. Auth check
  if (process.env.NODE_ENV === "production") {
    const key = req.query.key;
    console.log("[CRON DEBUG] Received key:", key);
    console.log("[CRON DEBUG] Server CRON_SECRET:", process.env.CRON_SECRET);

    if (key && key === process.env.CRON_SECRET) {
      // allow
    } else {
      const auth = req.headers.authorization;
      console.log("[CRON DEBUG] Received Authorization header:", auth);

      if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
        console.log("[CRON DEBUG] 401 Unauthorized triggered");
        return res.status(401).send("Unauthorized");
      }
    }
  }

  // 2. Method check
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 3. Schedule check
  const forceSend = req.query.force === "true";
  const today = new Date();
  const isTargetDate =
    today.getDate() === 11 && today.getHours() === 12;

  if (!forceSend && !isTargetDate) {
    return res.status(200).json({
      message: "Not the scheduled date/time, skipping email.",
    });
  }

  try {
    console.log("[MAIL DEBUG] Connecting to MongoDB...");
    await mongooseConnect();
    console.log("[MAIL DEBUG] Connected to MongoDB.");

    const { FROM_EMAIL, SALARY_MAIL_TO, SALARY_MAIL_CC } =
      process.env;

    if (!FROM_EMAIL || !SALARY_MAIL_TO) {
      return res.status(500).json({
        error: "Missing FROM_EMAIL or SALARY_MAIL_TO",
      });
    }

    // Fetch staff
    const staffList = await Staff.find({});
    if (!staffList.length) {
      return res.status(400).json({ error: "No staff records found" });
    }

    const currentMonth = new Date().toLocaleString("default", {
      month: "long",
    });
    const currentYear = new Date().getFullYear();

    // Calculate totals
    const totalNetSalary = staffList.reduce((sum, staff) => {
      const totalPenalty = (staff.penalty || []).reduce(
        (p, x) => p + (x.amount || 0),
        0
      );
      return sum + ((staff.salary || 0) - totalPenalty);
    }, 0);

    const formattedTotal = totalNetSalary.toLocaleString();

    const tableRows = staffList
      .map((staff) => {
        const penalty = (staff.penalty || []).reduce(
          (s, p) => s + (p.amount || 0),
          0
        );
        const net = (staff.salary || 0) - penalty;

        return `
          <tr>
            <td>${staff.name}</td>
            <td>${staff.bank?.accountName || "N/A"}</td>
            <td>${staff.bank?.accountNumber || "N/A"}</td>
            <td>${staff.bank?.bankName || "N/A"}</td>
            <td style="text-align:right;">₦${net.toLocaleString()}</td>
          </tr>
        `;
      })
      .join("");

    const mailHtml = `
      <h2>${currentMonth} ${currentYear} Salary Schedule</h2>
      <table border="1" cellpadding="8" cellspacing="0" width="100%">
        <tr>
          <th>Name</th>
          <th>Account Name</th>
          <th>Account Number</th>
          <th>Bank</th>
          <th>Amount</th>
        </tr>
        ${tableRows}
        <tr>
          <td colspan="4"><strong>Total</strong></td>
          <td><strong>₦${formattedTotal}</strong></td>
        </tr>
      </table>
    `;

    const mailOptions = {
      from: FROM_EMAIL, // ✅ FIXED
      to: SALARY_MAIL_TO,
      ...(SALARY_MAIL_CC && { cc: SALARY_MAIL_CC }),
      subject: `${currentMonth} ${currentYear} Salary Schedule`,
      html: mailHtml,
    };

    const result = await sendMail(mailOptions);

    console.log("✅ Email sent:", result.messageId);

    return res.status(200).json({
      message: "Salary email sent successfully",
      staffCount: staffList.length,
      totalSalary: formattedTotal,
    });
  } catch (err) {
    console.error("❌ Salary mail error:", err);
    return res.status(500).json({
      error: "Failed to send salary email",
      details: err.message,
    });
  }
}
