export function shareViaWhatsApp(report) {
  if (!report || !report.date) {
    alert("No report data available to share.");
    return;
  }

  const message = `📊 End of Day Report
Date: ${new Date(report.date).toLocaleDateString("en-GB")}
Location: ${report.location}

--- SUMMARY ---
• Cash B/F: ₦${Number(report.cashBroughtForward || 0).toLocaleString()}
• Cash Received: ₦${Number(report.cashToday || 0).toLocaleString()}
• Total Available: ₦${Number(report.totalCashAvailable || 0).toLocaleString()}
• Total Payments: -₦${Number(report.totalPayments || 0).toLocaleString()}
• Cash at Hand: ₦${Number(report.cashAtHand || 0).toLocaleString()}

--- PAYMENTS ---
${(report.payments || [])
  .map(
    (p) =>
      `• ${p.title} (${new Date(p.date || report.date).toLocaleDateString(
        "en-GB"
      )}): ₦${Number(p.amount).toLocaleString()}`
  )
  .join("\n")}
Total Payments: ₦${Number(report.totalPayments || 0).toLocaleString()}

👥 Staff on Duty: ${report.staff?.name || "N/A"}`;

  const whatsappURL = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(whatsappURL, "_blank");
}


export function copyReportToClipboard(report) {
  if (!report || !report.date) {
    alert("No report data to copy.");
    return;
  }

  let text = `📊 End of Day Report\n`;
  text += `Date: ${new Date(report.date).toLocaleDateString("en-GB")}\n`;
  text += `Location: ${report.location}\n\n`;

  text += `--- SUMMARY ---\n`;
  text += `• Cash B/F: ₦${Number(report.cashBroughtForward || 0).toLocaleString()}\n`;
  text += `• Cash Received: ₦${Number(report.cashToday || 0).toLocaleString()}\n`;
  text += `• Total Available: ₦${Number(report.totalCashAvailable || 0).toLocaleString()}\n`;
  text += `• Total Payments: -₦${Number(report.totalPayments || 0).toLocaleString()}\n`;
  text += `• Cash at Hand: ₦${Number(report.cashAtHand || 0).toLocaleString()}\n\n`;

  const payments = report.payments || [];
  if (payments.length) {
    text += `--- PAYMENTS ---\n`;
    payments.forEach((p) => {
      text += `• ${p.title} (${new Date(
        p.date || report.date
      ).toLocaleDateString("en-GB")}): ₦${Number(p.amount).toLocaleString()}\n`;
    });
    const total = payments.reduce(
      (sum, p) => sum + Number(p.amount || 0),
      0
    );
    text += `Total Payments: ₦${total.toLocaleString()}\n\n`;
  } else {
    text += `No payment records for this date.\n\n`;
  }

  text += `👥 Staff on Duty: ${report.staff?.name || "No staff recorded"}\n`;

  navigator.clipboard.writeText(text).then(() => {
    alert("Report copied to clipboard!");
  });
}
