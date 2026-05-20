import { mongooseConnect } from "@/lib/mongoose";
import {
  PETTY_CASH_TERMS_VERSION,
  PETTY_CASH_VENDOR_TYPE,
} from "@/lib/petty-cash";
import {
  buildPettyCashOnboardingProducts,
  buildVendorFields,
  createVendorOnboardingToken,
  resolveVendorProducts,
} from "@/lib/vendor-utils";
import Vendor from "@/models/Vendor";

const REQUIRED_ONBOARDING_FIELDS = [
  "companyName",
  "vendorRep",
  "repPhone",
  "email",
  "bankName",
  "accountName",
  "accountNumber",
];

function buildDuplicateQuery(vendorFields) {
  const checks = [];

  if (vendorFields.email) {
    checks.push({ email: vendorFields.email });
  }

  if (vendorFields.companyName && vendorFields.repPhone) {
    checks.push({
      companyName: vendorFields.companyName,
      repPhone: vendorFields.repPhone,
    });
  }

  if (checks.length === 0) return null;

  return {
    vendorType: PETTY_CASH_VENDOR_TYPE,
    $or: checks,
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method not allowed" });
  }

  await mongooseConnect();

  try {
    const vendorFields = buildVendorFields(
      { ...req.body, vendorType: PETTY_CASH_VENDOR_TYPE },
      PETTY_CASH_VENDOR_TYPE
    );
    const { products: onboardingProducts, hasIncompleteRows } =
      buildPettyCashOnboardingProducts(
        req.body?.products,
        vendorFields.businessCategory || vendorFields.mainProduct || "Petty Cash"
      );

    if (hasIncompleteRows) {
      return res.status(400).json({
        message: "Please provide both product name and price for each product row.",
      });
    }

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

    const duplicateQuery = buildDuplicateQuery(vendorFields);
    if (duplicateQuery) {
      const existingVendor = await Vendor.findOne(duplicateQuery).lean();

      if (existingVendor) {
        return res.status(409).json({
          message:
            "A petty cash vendor with the same business contact details already exists.",
        });
      }
    }

    const productRefs = await resolveVendorProducts(onboardingProducts);

    const vendor = await Vendor.create({
      ...vendorFields,
      mainProduct: vendorFields.mainProduct || onboardingProducts[0]?.name || "",
      products: productRefs,
      vendorType: PETTY_CASH_VENDOR_TYPE,
      onboardingToken: createVendorOnboardingToken(),
      onboardingComplete: true,
      onboardingSubmittedAt: new Date(),
      termsAccepted: true,
      termsAcceptedAt: new Date(),
      termsVersion: PETTY_CASH_TERMS_VERSION,
    });

    return res.status(201).json({
      message: "Vendor onboarding submitted successfully.",
      vendorId: vendor._id,
    });
  } catch (error) {
    console.error("Public petty cash onboarding error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}