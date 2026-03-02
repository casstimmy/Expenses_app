// lib/auth.js — HMAC-signed httpOnly cookie session + auth helpers
import crypto from "crypto";
import { mongooseConnect } from "@/lib/mongoose";
import { Staff } from "@/models/Staff";

const COOKIE_NAME = "ibile_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret() {
  return process.env.SESSION_SECRET || process.env.CRON_SECRET || "ibile-fallback-secret";
}

function hmacSign(payload) {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
}

// ─── Cookie helpers ──────────────────────────────────────────────

export function setAuthCookie(res, staffId, location) {
  const payload = JSON.stringify({ id: String(staffId), loc: location, ts: Date.now() });
  const signature = hmacSign(payload);
  const value = `${Buffer.from(payload).toString("base64")}.${signature}`;

  const parts = [
    `${COOKIE_NAME}=${value}`,
    "HttpOnly",
    "Path=/",
    `Max-Age=${COOKIE_MAX_AGE}`,
    "SameSite=Lax",
  ];
  if (process.env.NODE_ENV === "production") parts.push("Secure");

  res.setHeader("Set-Cookie", parts.join("; "));
}

export function clearAuthCookie(res) {
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`
  );
}

// ─── Parse raw cookie header ─────────────────────────────────────

function parseCookies(req) {
  const cookies = {};
  (req.headers.cookie || "").split(";").forEach((c) => {
    const [name, ...rest] = c.trim().split("=");
    if (name) cookies[name] = rest.join("=");
  });
  return cookies;
}

// ─── Read & verify session cookie → staff doc ────────────────────

export async function getAuthStaff(req) {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;

  try {
    const [encoded, signature] = token.split(".");
    if (!encoded || !signature) return null;

    const payload = Buffer.from(encoded, "base64").toString();
    if (hmacSign(payload) !== signature) return null; // tampered

    const { id } = JSON.parse(payload);
    if (!id) return null;

    await mongooseConnect();
    const staff = await Staff.findById(id).lean();
    if (!staff || staff.active === false) return null;

    // Strip password before returning
    const { password, ...safeStaff } = staff;
    return safeStaff;
  } catch {
    return null;
  }
}

// ─── Inline auth guard for API routes ────────────────────────────
// Usage:
//   const staff = await requireAuth(req, res);
//   if (!staff) return;                        // 401 already sent
//
//   const admin = await requireAuth(req, res, ["admin"]);
//   if (!admin) return;                        // 401 or 403 already sent

export async function requireAuth(req, res, roles = null) {
  // Allow cron / system calls that present a valid key
  if (req.query?.key && req.query.key === process.env.CRON_SECRET) {
    await mongooseConnect();
    return { _id: "system", role: "admin", name: "System (Cron)" };
  }

  const staff = await getAuthStaff(req);

  if (!staff) {
    res.status(401).json({ error: "Unauthorized. Please log in." });
    return null;
  }

  if (roles && roles.length > 0 && !roles.includes(staff.role)) {
    res.status(403).json({ error: "Forbidden. Insufficient permissions." });
    return null;
  }

  return staff;
}
