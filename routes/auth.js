// routes/auth.js
import { sendMagicLink } from "../lib/email.js";
import {
  createLinkToken,
  verifyLinkToken,
  createSessionToken,
  parseBearer,
  getUserFromToken,
} from "../lib/auth.js";

export default async function routes(app) {
  /**
   * POST /api/auth/request-link
   * body: { email: string }
   * Sends a magic link to the email with a short-lived token.
   */
  app.post("/api/auth/request-link", async (req, reply) => {
    const { email } = req.body || {};
    if (!email || typeof email !== "string") {
      return reply.code(400).send({ ok: false, error: "Email required" });
    }

    const token = createLinkToken(email.toLowerCase().trim());
    const frontend = process.env.FRONTEND_URL || "http://localhost:5173";
    const link = `${frontend.replace(/\/+$/, "")}/auth/verify?token=${encodeURIComponent(
      token
    )}`;

    const sent = await sendMagicLink(email, link);
    if (!sent.ok) {
      app.log.error({ err: sent.error }, "sendMagicLink failed");
      return reply.code(500).send({ ok: false, error: "Email failed" });
    }

    return { ok: true };
  });

  /**
   * GET /api/auth/verify-link?token=...
   * Verifies token, enforces single-use, returns a session token.
   */
  app.get("/api/auth/verify-link", async (req, reply) => {
    const { token } = req.query || {};
    if (!token) return reply.code(400).send({ ok: false, error: "Missing token" });

    try {
      const payload = verifyLinkToken(String(token));
      const session = createSessionToken(payload.sub);
      // In a real app, create/find user record here (DB), then include user profile
      return { ok: true, token: session, user: { email: payload.sub } };
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return reply.code(400).send({ ok: false, error: "Expired link" });
      }
      if (err.code === "USED") {
        return reply.code(400).send({ ok: false, error: "Link already used" });
      }
      return reply.code(400).send({ ok: false, error: "Invalid link" });
    }
  });

  /**
   * GET /api/me
   * Reads Bearer session token and returns the user profile.
   */
  app.get("/api/me", async (req, reply) => {
    const token = parseBearer(req);
    const user = getUserFromToken(token);
    if (!user) return reply.code(401).send({ ok: false, error: "Unauthorized" });
    return { ok: true, user };
  });

  /**
   * POST /api/auth/logout
   * (For stateless JWT, “logout” is client-side: delete token.
   *  You could maintain a denylist here if needed.)
   */
  app.post("/api/auth/logout", async () => {
    return { ok: true };
  });
}
