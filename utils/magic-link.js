import crypto from "crypto";

export function createToken() {
  // 32 bytes -> 43-character base64url string
  return crypto.randomBytes(32).toString("base64url");
}

export function buildVerifyUrl(frontendUrl, token) {
  const base = frontendUrl.replace(/\/+$/, "");
  return `${base}/auth/verify?token=${encodeURIComponent(token)}`;
}
