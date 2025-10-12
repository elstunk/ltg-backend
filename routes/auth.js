import { Resend } from "resend";
import { createToken, buildVerifyUrl } from "../utils/magic-link.js";

export default async function authRoutes(app, opts) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const FRONTEND_URL = process.env.FRONTEND_URL || "https://ltg-frontend.vercel.app";

  app.post("/api/auth/request-link", async (req, reply) => {
    const { email } = req.body;
    if (!email) return reply.code(400).send({ message: "Missing email" });

    const token = createToken();
    // TODO: Save token + email to your DB table (login_tokens)
    const verifyUrl = buildVerifyUrl(FRONTEND_URL, token);

    // Send email with Resend
    await resend.emails.send({
      from: "Login <login@yourdomain.com>",
      to: email,
      subject: "Your sign-in link",
      text: `Click here to sign in: ${verifyUrl}`,
      html: `<p>Click below to sign in:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
    });

    return { ok: true };
  });

  app.get("/api/auth/verify", async (req, reply) => {
    const { token } = req.query;
    if (!token) return reply.code(400).send({ message: "Missing token" });

    // TODO: Look up token in DB, validate, mark used, etc.
    return { ok: true };
  });
}
