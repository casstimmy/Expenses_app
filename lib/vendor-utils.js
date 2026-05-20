import crypto from "crypto";
import mongoose from "mongoose";
import Product from "@/models/Product";
import {
  PETTY_CASH_ONBOARDING_PATH,
  PETTY_CASH_TERMS,
  PETTY_CASH_VENDOR_TYPE,
  STOCK_VENDOR_TYPE,
} from "@/lib/petty-cash";

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeVendorType(vendorType) {
  return vendorType === PETTY_CASH_VENDOR_TYPE
    ? PETTY_CASH_VENDOR_TYPE
    : STOCK_VENDOR_TYPE;
}

export function getVendorTypeFilter(vendorType) {
  if (!vendorType) return {};

  const normalizedType = normalizeVendorType(vendorType);

  if (normalizedType === PETTY_CASH_VENDOR_TYPE) {
    return { vendorType: PETTY_CASH_VENDOR_TYPE };
  }

  return {
    $or: [
      { vendorType: STOCK_VENDOR_TYPE },
      { vendorType: { $exists: false } },
      { vendorType: null },
    ],
  };
}

export function buildVendorFields(payload = {}, fallbackType = STOCK_VENDOR_TYPE) {
  const normalizedType = normalizeVendorType(payload.vendorType || fallbackType);

  return {
    companyName: cleanString(payload.companyName),
    vendorType: normalizedType,
    vendorRep: cleanString(payload.vendorRep),
    repPhone: cleanString(payload.repPhone),
    email: cleanString(payload.email).toLowerCase(),
    address: cleanString(payload.address),
    mainProduct: cleanString(payload.mainProduct),
    businessCategory: cleanString(payload.businessCategory),
    serviceDescription: cleanString(payload.serviceDescription),
    paymentTerms: cleanString(payload.paymentTerms),
    bankName: cleanString(payload.bankName),
    accountName: cleanString(payload.accountName),
    accountNumber: cleanString(payload.accountNumber),
  };
}

export async function resolveVendorProducts(products = []) {
  if (!Array.isArray(products) || products.length === 0) {
    return [];
  }

  return Promise.all(
    products.map(async (prod) => {
      let productId;

      const {
        product,
        name,
        category,
        price,
        costPrice,
        isPack,
        unitsPerPack,
      } = prod || {};

      if (product && product !== "custom") {
        if (
          typeof product === "string" &&
          mongoose.Types.ObjectId.isValid(product)
        ) {
          productId = new mongoose.Types.ObjectId(product);
          await Product.findByIdAndUpdate(productId, {
            isPack: !!isPack,
            unitsPerPack: isPack ? Number(unitsPerPack) || 1 : 1,
          });
        } else {
          throw new Error(`Invalid product ID: ${product}`);
        }
      } else {
        const cleanName = cleanString(name);
        const cleanCategory = cleanString(category);

        if (!cleanName || !cleanCategory) {
          throw new Error(
            "Product name and category are required for custom product"
          );
        }

        const newProduct = await Product.create({
          name: cleanName,
          category: cleanCategory,
          price: Number(price ?? costPrice) || 0,
          isPack: !!isPack,
          unitsPerPack: isPack ? Number(unitsPerPack) || 1 : 1,
        });

        productId = newProduct._id;
      }

      return {
        product: productId,
        price: Number(price ?? costPrice) || 0,
      };
    })
  );
}

export function createVendorOnboardingToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function getRequestBaseUrl(req) {
  const protocol = req.headers["x-forwarded-proto"] || "http";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${protocol}://${host}`;
}

export function buildPettyCashOnboardingLink(baseUrl, token) {
  return `${baseUrl}${PETTY_CASH_ONBOARDING_PATH}/${token}`;
}

export function buildPettyCashInvitationMessage({
  companyName,
  vendorRep,
  onboardingLink,
}) {
  const contactName = vendorRep || companyName || "Vendor";

  return [
    `Hello ${contactName},`,
    "You have been invited to complete the Ibile petty cash vendor onboarding form.",
    `Complete it here: ${onboardingLink}`,
    "Please submit accurate business, contact, and bank details.",
    "Regards, Ibile",
  ].join(" ");
}

export function buildPettyCashInvitationEmail({
  companyName,
  vendorRep,
  onboardingLink,
}) {
  const contactName = vendorRep || companyName || "Vendor";
  const subject = `Ibile Petty Cash Vendor Onboarding${
    companyName ? ` - ${companyName}` : ""
  }`;
  const textMessage = buildPettyCashInvitationMessage({
    companyName,
    vendorRep,
    onboardingLink,
  });

  const termsMarkup = PETTY_CASH_TERMS.map(
    (term) => `<li><strong>${term.title}:</strong> ${term.description}</li>`
  ).join("");

  return {
    subject,
    text: textMessage.replace(/ Ibile$/, "\n\nRegards,\nIbile"),
    html: `
      <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
        <p>Hello ${contactName},</p>
        <p>
          You have been invited to complete the <strong>Ibile petty cash vendor onboarding form</strong>.
        </p>
        <p>
          Please use the secure link below to submit your business and payment details:
        </p>
        <p>
          <a href="${onboardingLink}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 8px; font-weight: 600;">
            Complete Vendor Onboarding
          </a>
        </p>
        <p style="word-break: break-all; color: #4b5563;">${onboardingLink}</p>
        <p>Key conditions covered on the form include:</p>
        <ul>${termsMarkup}</ul>
        <p>Regards,<br />Ibile</p>
      </div>
    `,
  };
}