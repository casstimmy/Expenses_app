import { requireAuth } from "@/lib/auth";
import { sendMail } from "@/lib/mailer";
import { mongooseConnect } from "@/lib/mongoose";
import {
  PETTY_CASH_TERMS_VERSION,
  PETTY_CASH_VENDOR_TYPE,
} from "@/lib/petty-cash";
import {
  buildPettyCashInvitationEmail,
  buildPettyCashOnboardingLink,
  buildVendorFields,
  createVendorOnboardingToken,
  getRequestBaseUrl,
} from "@/lib/vendor-utils";
import Vendor from "@/models/Vendor";

const INVITE_FIELDS = [
  "companyName",
  "vendorRep",
  "repPhone",
  "email",
  "address",
  "mainProduct",
  "businessCategory",
  "serviceDescription",
  "paymentTerms",
  "bankName",
  "accountName",
  "accountNumber",
];

export default async function handler(req, res) {
  const staff = await requireAuth(req, res);
  if (!staff) return;

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  await mongooseConnect();

  try {
    const { vendorId, sendEmail = true } = req.body || {};
    const vendorFields = buildVendorFields(
      { ...req.body, vendorType: PETTY_CASH_VENDOR_TYPE },
      PETTY_CASH_VENDOR_TYPE
    );

    let vendor;

    if (vendorId) {
      vendor = await Vendor.findById(vendorId);

      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }

      INVITE_FIELDS.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(req.body || {}, field)) {
          vendor[field] = vendorFields[field];
        }
      });
      vendor.vendorType = PETTY_CASH_VENDOR_TYPE;
    } else {
      if (!vendorFields.companyName) {
        return res.status(400).json({ error: "Company name is required" });
      }

      vendor = new Vendor({
        ...vendorFields,
        vendorType: PETTY_CASH_VENDOR_TYPE,
      });
    }

    if (!vendor.onboardingToken) {
      vendor.onboardingToken = createVendorOnboardingToken();
    }

    vendor.onboardingSentAt = new Date();
    vendor.termsVersion = PETTY_CASH_TERMS_VERSION;

    await vendor.save();

    const onboardingLink = buildPettyCashOnboardingLink(
      getRequestBaseUrl(req),
      vendor.onboardingToken
    );

    let emailSent = false;
    let emailError = "";

    if (sendEmail) {
      if (!vendor.email) {
        emailError = "Vendor email is missing, so the onboarding link was not emailed.";
      } else if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        emailError = "Email delivery is not configured. Copy the onboarding link manually.";
      } else {
        try {
          const mail = buildPettyCashInvitationEmail({
            companyName: vendor.companyName,
            vendorRep: vendor.vendorRep,
            onboardingLink,
          });

          await sendMail({
            from: process.env.EMAIL_FROM || `"BizSuits" <${process.env.EMAIL_USER}>`,
            to: vendor.email,
            subject: mail.subject,
            text: mail.text,
            html: mail.html,
          });
          emailSent = true;
        } catch (error) {
          console.error("Petty cash invite mail error:", error);
          emailError = error.message || "Failed to send onboarding email.";
        }
      }
    }

    return res.status(vendorId ? 200 : 201).json({
      success: true,
      vendor,
      onboardingLink,
      emailSent,
      emailError,
    });
  } catch (error) {
    console.error("Petty cash vendor invite error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to create petty cash vendor invite",
    });
  }
}