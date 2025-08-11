import { mongooseConnect } from "@/lib/mongoose";
import nodemailer from "nodemailer";
import path from "path";
import { Staff } from "@/models/Staff";

export default async function handler(req, res) {
  const auth = req.headers.authorization;

  const today = new Date();
  const isTargetDate =
    today.getFullYear() === 2025 &&
    today.getMonth() === 7 && // August
    today.getDate() === 11 &&
    today.getHours() === 11;

  if (!isTargetDate) {
    return res
      .status(200)
      .json({ message: "Not the scheduled date/time, skipping email." });
  }

  if (
    process.env.NODE_ENV === "production" &&
    auth !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return res.status(401).send("Unauthorized");
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await mongooseConnect();

    const { EMAIL_USER, EMAIL_PASS } = process.env;
    if (!EMAIL_USER || !EMAIL_PASS) {
      return res.status(500).json({ error: "Missing email credentials" });
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

    const staffList = await Staff.find({});
    const currentMonth = new Date().toLocaleString("default", {
      month: "long",
    });
    const currentYear = new Date().getFullYear();

    // 1. Keep it as a number here
    const totalNetSalary = staffList.reduce((sum, staff) => {
      const totalPenalty = (staff.penalty || []).reduce(
        (penSum, p) => penSum + (p.amount || 0),
        0
      );
      const net = (staff.salary || 0) - totalPenalty;
      return sum + net;
    }, 0);

    const formattedTotal = Number(totalNetSalary || 0).toLocaleString();

    const tableRows = staffList
      .map((staff) => {
        // Calculate total penalties directly from staff.penalty array
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
            <td style="border:1px solid #ddd;padding:8px;">₦${netSalary}</td>
          </tr>
        `;
      })
      .join("");

    const mailHtml = `
  <div style="font-family:'Segoe UI',Roboto,sans-serif;background:#f0f4f8;padding:30px;">
    <div style="max-width:700px;margin:auto;background:#ffffff;padding:40px 30px;border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,0.1);border:1px solid #e1e1e1;">
      
      <!-- Logo -->
      <div style="text-align:center;margin-bottom:30px;">
        <img src="cid:logo_cid" alt="Company Logo" style="max-width:120px;height:auto;" />
      </div>

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

    const mailOptions = {
      from: `"Ibile Mail" <${EMAIL_USER}>`,
      /**  to: "paul@oakleighinvestments.com",
      cc: "boyeadelo@gmail.com, hello.ayoola@gmail.com",
      
    */
      to: "hello.ayoola@gmail.com",
      subject: `${currentMonth} ${currentYear} Salary Schedule`,
      html: mailHtml,
      attachments: [
        {
          filename: "logo.png",
          path: path.resolve(process.cwd(), "public", "image", "LogoName.png"),
          cid: "logo_cid",
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ message: "Salary email sent successfully." });
  } catch (err) {
    console.error("❌ Error sending salary email:", err);
    return res.status(500).json({
      error: "Failed to send salary email. Please try again.",
      details: err.message,
    });
  }
}
s;
