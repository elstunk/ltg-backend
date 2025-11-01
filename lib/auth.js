// lib/auth.js
import jwt from "jsonwebtoken";

/**
 * We sign a short-lived token embedding the email.
 * The token is single-use (best-effort) via an in-memory "used" set.
 * Swap this for Redis/DB in production for multi-instance.
 */

const AUTH_SECRET = process.env.AUTH_SECRET || "dev-secret";
const TTL_MIN = Number(process.env.LINK_TTL_MINUTES || 30);

// In-memory "used once" store: tokenId => usedAt (ISO)
const USED = new Map();

/** Create a signed magic-link token */
export function createLinkToken(email) {
  const jti = cryptoRandomId();
  const token = jwt.sign(
    { sub: email, typ: "magic", jti },
    AUTH_SECRET,
    { expiresIn: `${TTL_MIN}m` }
  );
  return token;
}

/** Verify token + enforce single-use */
export function verifyLinkToken(token) {
  const payload = jwt.verify(token, AUTH_SECRET); // throws if invalid/expired
  if (USED.has(payload.jti)) {
    const usedAt = USED.get(payload.jti);
    const err = new Error("Token already used");
    err.code = "USED";
    err.usedAt = usedAt;
    throw err;
  }
  // mark as used
  USED.set(payload.jti, new Date().toISOString());
  return payload; // { sub: email, typ, jti, iat, exp }
}

/** Create a session token (longer-lived if you want) */
export function createSessionToken(email) {
  // For demo, 30 days; adjust as needed
  return jwt.sign({ sub: email, typ: "session" }, AUTH_SECRET, {
    expiresIn: "30d",
  });
}

/** Extract Bearer token string from request */
export function parseBearer(req) {
  const h = req.headers.authorization || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

/** Decode a session token (returns null on failure) */
export function getUserFromToken(token) {
  try {
    const p = jwt.verify(token, AUTH_SECRET);
    if (p?.typ !== "session") return null;
    return { email: p.sub };
  } catch {
    return null;
  }
}

/** tiny helper for unique IDs */
function cryptoRandomId() {
  // 16 random bytes hex
  return [...crypto.getRandomValues(new Uint8Array(16))]
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// Node <19 fallback for crypto.getRandomValues
import { randomBytes } from "node:crypto";
const crypto = globalThis.crypto ?? {
  getRandomValues: (arr) => {
    const buf = randomBytes(arr.length);
    arr.set(buf);
    return arr;
  },
};
