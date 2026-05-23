import { requireAuth } from "@/lib/auth";
import { sendMail } from "@/lib/mailer";
import { sendSmsMessage, sendWhatsAppMessage } from "@/lib/messaging";
import { mongooseConnect } from "@/lib/mongoose";
import {
  PETTY_CASH_TERMS_VERSION,
  PETTY_CASH_VENDOR_TYPE,
} from "@/lib/petty-cash";
import {
  buildPettyCashInvitationEmail,
  buildPettyCashInvitationMessage,
  buildPettyCashOnboardingLink,
  buildVendorFields,
  createVendorOnboardingToken,
  getRequestBaseUrl,
  resolveVendorProducts,
} from "@/lib/vendor-utils";
import Vendor from "@/models/Vendor";

const DELIVERY_CHANNELS = ["email", "sms", "whatsapp"];

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
    const hasProductsPayload = Object.prototype.hasOwnProperty.call(
      req.body || {},
      "products"
    );
    const productRefs = hasProductsPayload
      ? await resolveVendorProducts(req.body?.products)
      : null;
    const fallbackMainProduct = Array.isArray(req.body?.products)
      ?
          req.body.products.find((product) => typeof product?.name === "string" && product.name.trim())
            ?.name?.trim() || ""
      : "";
    const channels = Array.from(
      new Set(
        Array.isArray(req.body?.channels) && req.body.channels.length > 0
          ? req.body.channels.filter((channel) => DELIVERY_CHANNELS.includes(channel))
          : sendEmail
          ? ["email"]
          : []
      )
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

      if (hasProductsPayload) {
        vendor.products = productRefs;
      }

      if (!vendor.mainProduct && fallbackMainProduct) {
        vendor.mainProduct = fallbackMainProduct;
      }

      vendor.vendorType = PETTY_CASH_VENDOR_TYPE;
    } else {
      if (!vendorFields.companyName) {
        return res.status(400).json({ error: "Company name is required" });
      }

      vendor = new Vendor({
        ...vendorFields,
        mainProduct: vendorFields.mainProduct || fallbackMainProduct,
        products: productRefs || [],
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

    const invitationMessage = buildPettyCashInvitationMessage({
      companyName: vendor.companyName,
      vendorRep: vendor.vendorRep,
      onboardingLink,
    });

    const delivery = {
      email: { requested: channels.includes("email"), sent: false, error: "" },
      sms: { requested: channels.includes("sms"), sent: false, error: "" },
      whatsapp: {
        requested: channels.includes("whatsapp"),
        sent: false,
        error: "",
      },
    };

    if (delivery.email.requested) {
      if (!vendor.email) {
        delivery.email.error =
          "Vendor email is missing, so the onboarding link was not emailed.";
      } else if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        delivery.email.error =
          "Email delivery is not configured. Copy the onboarding link manually.";
      } else {
        try {
          const mail = buildPettyCashInvitationEmail({
            companyName: vendor.companyName,
            vendorRep: vendor.vendorRep,
            onboardingLink,
          });

          await sendMail({
            from: process.env.EMAIL_FROM || `"Ibile" <${process.env.EMAIL_USER}>`,
            to: vendor.email,
            subject: mail.subject,
            text: mail.text,
            html: mail.html,
          });
          delivery.email.sent = true;
        } catch (error) {
          console.error("Petty cash invite mail error:", error);
          delivery.email.error =
            error.message || "Failed to send onboarding email.";
        }
      }
    }

    if (delivery.sms.requested) {
      if (!vendor.repPhone) {
        delivery.sms.error =
          "Vendor phone number is missing, so the SMS invite was not sent.";
      } else {
        try {
          await sendSmsMessage({
            to: vendor.repPhone,
            body: invitationMessage,
          });
          delivery.sms.sent = true;
        } catch (error) {
          console.error("Petty cash invite SMS error:", error);
          delivery.sms.error = error.message || "Failed to send SMS invite.";
        }
      }
    }

    if (delivery.whatsapp.requested) {
      if (!vendor.repPhone) {
        delivery.whatsapp.error =
          "Vendor phone number is missing, so the WhatsApp invite was not sent.";
      } else {
        try {
          await sendWhatsAppMessage({
            to: vendor.repPhone,
            body: invitationMessage,
          });
          delivery.whatsapp.sent = true;
        } catch (error) {
          console.error("Petty cash invite WhatsApp error:", error);
          delivery.whatsapp.error =
            error.message || "Failed to send WhatsApp invite.";
        }
      }
    }

    return res.status(vendorId ? 200 : 201).json({
      success: true,
      vendor,
      onboardingLink,
      delivery,
      emailSent: delivery.email.sent,
      emailError: delivery.email.error,
    });
  } catch (error) {
    console.error("Petty cash vendor invite error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to create petty cash vendor invite",
    });
  }
}