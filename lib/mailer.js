// This is a template for the old Nodemailer-based mailer utility
import nodemailer from "nodemailer";

export function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

export async function sendMail(options) {
  const transporter = createTransporter();
  return transporter.sendMail(options);
}
