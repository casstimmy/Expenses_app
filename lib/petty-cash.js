export const STOCK_VENDOR_TYPE = "stock";
export const PETTY_CASH_VENDOR_TYPE = "petty-cash";
export const PETTY_CASH_ONBOARDING_PATH = "/petty-cash-onboarding";
export const PETTY_CASH_TERMS_VERSION = "2026-05-20";

export const PETTY_CASH_TERMS = [
  {
    title: "Accurate business details",
    description:
      "All company, representative, contact, and bank details submitted on this form must be complete, current, and accurate.",
  },
  {
    title: "Approved petty cash only",
    description:
      "Payments will only be processed for petty cash requests that have been approved internally and matched to the registered vendor record.",
  },
  {
    title: "Supporting documents",
    description:
      "The vendor may be asked to provide quotations, invoices, receipts, or delivery confirmation before payment is released.",
  },
  {
    title: "Registered payment account",
    description:
      "BizSuits will only pay into the bank account submitted on this form unless the vendor formally provides an approved update.",
  },
  {
    title: "Compliance and conduct",
    description:
      "False information, inflated pricing, or failure to deliver agreed goods or services can lead to suspension from the petty cash vendor list.",
  },
  {
    title: "Contact and record keeping",
    description:
      "By submitting the form, the vendor authorizes BizSuits to contact the representative provided and to keep the submitted record for operational and audit purposes.",
  },
];