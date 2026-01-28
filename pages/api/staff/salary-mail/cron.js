import { mongooseConnect } from "@/lib/mongoose";
import { sendMail } from "@/lib/mailer";
import { Staff } from "@/models/Staff";

export default async function handler(req, res) {
  /* -------- METHOD -------- */
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  /* -------- AUTH -------- */
  if (process.env.NODE_ENV === "production") {
    const auth = req.headers.authorization;
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  /* -------- SCHEDULE -------- */
  const forceSend = req.query.force === "true";
  const now = new Date();

  const isScheduled =
    now.getDate() === 11 && now.getHours() === 12;

  if (!forceSend && !isScheduled) {
    return res.status(200).json({
      message: "Not scheduled time",
    });
  }

  try {
    await mongooseConnect();

    const { FROM_EMAIL, SALARY_MAIL_TO } = process.env;
    if (!FROM_EMAIL || !SALARY_MAIL_TO) {
      return res.status(500).json({
        error: "Missing mail env variables",
      });
    }

    const staffList = await Staff.find({});
    if (!staffList.length) {
      return res.status(400).json({ error: "No staff found" });
    }

    const month = now.toLocaleString("default", { month: "long" });
    const year = now.getFullYear();

    let total = 0;

    const rows = staffList
      .map((s) => {
        const penalty = (s.penalty || []).reduce(
          (a, b) => a + Number(b.amount || 0),
          0
        );

        const net = Number(s.salary || 0) - penalty;
        total += net;

        return `
          <tr>
            <td>${s.name}</td>
            <td>${s.bank?.accountName || "-"}</td>
            <td>${s.bank?.accountNumber || "-"}</td>
            <td>${s.bank?.bankName || "-"}</td>
            <td style="text-align:right">₦${net.toLocaleString()}</td>
          </tr>
        `;
      })
      .join("");

    const html = `
      <h2>${month} ${year} Salary Schedule</h2>
      <table border="1" cellpadding="8" cellspacing="0" width="100%">
        <tr>
          <th>Name</th>
          <th>Account</th>
          <th>Number</th>
          <th>Bank</th>
          <th>Amount</th>
        </tr>
        ${rows}
        <tr>
          <td colspan="4"><b>Total</b></td>
          <td><b>₦${total.toLocaleString()}</b></td>
        </tr>
      </table>
    `;

    await sendMail({
      from: FROM_EMAIL,
      to: SALARY_MAIL_TO,
      subject: `${month} ${year} Salary Schedule`,
      html,
    });

    return res.status(200).json({
      message: "Salary mail sent",
      staffCount: staffList.length,
      total,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Mail failed",
      details: err.message,
    });
  }
}
