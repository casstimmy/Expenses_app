import { mongooseConnect } from "@/lib/mongoose";
import {
  PETTY_CASH_TERMS_VERSION,
  PETTY_CASH_VENDOR_TYPE,
} from "@/lib/petty-cash";
import { buildVendorFields } from "@/lib/vendor-utils";
import Vendor from "@/models/Vendor";

const REQUIRED_ONBOARDING_FIELDS = [
  "companyName",
  "vendorRep",
  "repPhone",
  "email",
  "address",
  "businessCategory",
  "serviceDescription",
  "bankName",
  "accountName",
  "accountNumber",
];

export default async function handler(req, res) {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: "Token is required" });
  }

  await mongooseConnect();

  const vendor = await Vendor.findOne({
    onboardingToken: token,
    vendorType: PETTY_CASH_VENDOR_TYPE,
  });

  if (!vendor) {
    return res.status(404).json({ message: "Invalid or expired link" });
  }

  if (req.method === "GET") {
    return res.status(200).json({
      companyName: vendor.companyName || "",
      vendorRep: vendor.vendorRep || "",
      repPhone: vendor.repPhone || "",
      email: vendor.email || "",
      address: vendor.address || "",
      mainProduct: vendor.mainProduct || "",
      businessCategory: vendor.businessCategory || "",
      serviceDescription: vendor.serviceDescription || "",
      paymentTerms: vendor.paymentTerms || "",
      bankName: vendor.bankName || "",
      accountName: vendor.accountName || "",
      accountNumber: vendor.accountNumber || "",
      onboardingComplete: vendor.onboardingComplete,
      termsAccepted: vendor.termsAccepted,
      termsVersion: vendor.termsVersion || PETTY_CASH_TERMS_VERSION,
    });
  }

  if (req.method === "POST") {
    try {
      const vendorFields = buildVendorFields(
        { ...req.body, vendorType: PETTY_CASH_VENDOR_TYPE },
        PETTY_CASH_VENDOR_TYPE
      );

      const missingFields = REQUIRED_ONBOARDING_FIELDS.filter(
        (field) => !vendorFields[field]
      );

      if (missingFields.length > 0) {
        return res.status(400).json({
          message: `Please complete the required fields: ${missingFields.join(
            ", "
          )}`,
        });
      }

      if (!req.body?.termsAccepted) {
        return res.status(400).json({
          message: "You must accept the terms and conditions before submitting.",
        });
      }

      vendor.set({
        ...vendorFields,
        vendorType: PETTY_CASH_VENDOR_TYPE,
        onboardingComplete: true,
        onboardingSubmittedAt: new Date(),
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        termsVersion: PETTY_CASH_TERMS_VERSION,
      });

      await vendor.save();

      return res
        .status(200)
        .json({ message: "Vendor onboarding submitted successfully." });
    } catch (error) {
      console.error("Petty cash onboarding error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ message: "Method not allowed" });
}