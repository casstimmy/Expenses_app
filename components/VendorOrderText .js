export const VendorOrderText  = (vendor) => {
  const lines = [];

  lines.push(`📦 Vendor: ${vendor.companyName}`);
  lines.push(`👤 Rep: ${vendor.vendorRep} - ${vendor.repPhone}`);
  if (vendor.email) lines.push(`📧 Email: ${vendor.email}`);
  if (vendor.address) lines.push(`🏠 Address: ${vendor.address}`);
  if (vendor.mainProduct) lines.push(`🛒 Main Product: ${vendor.mainProduct}`);

  lines.push("");
  lines.push("🏦 Bank Details:");
  lines.push(`- Bank: ${vendor.bankName}`);
  lines.push(`- Account Name: ${vendor.accountName}`);
  lines.push(`- Account Number: ${vendor.accountNumber}`);

  lines.push("");
  lines.push("🛍️ Products Supplied:");
  (vendor.products || []).forEach((p, index) => {
    const name = p.name || p.product?.name || "Unnamed";
    const category = p.category || p.product?.category || "Uncategorized";
    const price = p.price ? `₦${Number(p.price).toFixed(2)}` : "₦0.00";
    const prefix = p.product === "custom" || !p.product?._id ? "Custom: " : "";
    lines.push(`${index + 1}. ${prefix}${name} - ${category} - ${price}`);
  });

  return lines.join("\n");
};
