// lib/mailer.js — Nodemailer utility (Gmail SMTP with App Password)
import nodemailer from "nodemailer";

export function createTransporter() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // TLS (not SSL)
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 10000,
    socketTimeout: 10000,
  });
}

export async function sendMail(options) {
  const transporter = createTransporter();
  // Verify connection before sending
  await transporter.verify();
  return transporter.sendMail(options);
}
