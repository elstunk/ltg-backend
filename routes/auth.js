// routes/auth.js

export default async function routes(app) {
  app.get("/api/auth/verify-link", async (req, reply) => {
    const { token } = req.query || {};
    if (!token) return reply.code(400).send({ ok: false, error: "Missing token" });

    // TODO: verify token + mark as used, find/create user, etc.
    // For demo purposes, accept any token and mint a fake session string.
    const session = "demo-session-" + token.slice(0, 8);
    return { ok: true, token: session };
  });

  // Optional: a /api/me endpoint if you want to read session and return user
  app.get("/api/me", async (req, reply) => {
    const auth = req.headers.authorization || "";
    const match = auth.match(/^Bearer\s+(.+)$/);
    if (!match) return reply.code(401).send({ ok: false });
    // TODO: decode + look up user. Demo:
    return { ok: true, user: { email: "user@example.com", name: "Demo User" } };
  });
}
