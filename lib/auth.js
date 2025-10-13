export function parseBearer(req) {
  const h = req.headers.authorization || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

export function getUserFromToken(token) {
  if (!token) return null;
  return { email: "user@example.com", name: "Demo User", sub: token };
}
