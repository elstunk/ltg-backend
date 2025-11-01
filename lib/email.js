// lib/email.js
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM || "no-reply@send.lumbertiergolf.com";

export async function sendMagicLink(email, link) {
  try {
    const { data, error } = await resend.emails.send({
      from: `LumberTier Golf <${FROM}>`,
      to: email,
      subject: "Your sign-in link for LumberTier Golf",
      html: `
        <div style="font-family: system-ui; line-height: 1.5">
          <h2 style="margin:0 0 12px">Sign in to LumberTier Golf</h2>
          <p>Click the button below to continue:</p>
          <p>
            <a href="${link}"
               style="display:inline-block;background:#1a73e8;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600">
               Sign In
            </a>
          </p>
          <p style="color:#666;font-size:.9em">This link expires in ${Number(process.env.LINK_TTL_MINUTES || 30)} minutes.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>
          <p style="color:#777;font-size:.85em">If you didn’t request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    if (error) throw error;
    return { ok: true, id: data?.id };
  } catch (err) {
    console.error("Email send failed:", err);
    return { ok: false, error: err?.message || String(err) };
  }
}

