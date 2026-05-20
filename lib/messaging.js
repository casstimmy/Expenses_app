import twilio from "twilio";

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error(
      "Twilio is not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN."
    );
  }

  return twilio(accountSid, authToken);
}

export function normalizePhoneNumber(phone) {
  const rawValue = String(phone || "").trim();
  if (!rawValue) {
    throw new Error("Phone number is required.");
  }

  const compact = rawValue.replace(/[\s()-]/g, "");
  const defaultCountryCode =
    process.env.TWILIO_DEFAULT_COUNTRY_CODE || "+234";

  if (compact.startsWith("+")) {
    return compact;
  }

  if (compact.startsWith("0")) {
    return `${defaultCountryCode}${compact.slice(1)}`;
  }

  return `${defaultCountryCode}${compact.replace(/^\+/, "")}`;
}

export async function sendSmsMessage({ to, body }) {
  const from = process.env.TWILIO_SMS_FROM;
  if (!from) {
    throw new Error("SMS delivery is not configured. Set TWILIO_SMS_FROM.");
  }

  const client = getTwilioClient();
  return client.messages.create({
    from,
    to: normalizePhoneNumber(to),
    body,
  });
}

export async function sendWhatsAppMessage({ to, body }) {
  const from = process.env.TWILIO_WHATSAPP_FROM;
  if (!from) {
    throw new Error(
      "WhatsApp delivery is not configured. Set TWILIO_WHATSAPP_FROM."
    );
  }

  const client = getTwilioClient();
  return client.messages.create({
    from,
    to: `whatsapp:${normalizePhoneNumber(to)}`,
    body,
  });
}