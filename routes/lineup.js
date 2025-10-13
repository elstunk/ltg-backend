import { addEntry } from "../data/mock.js";
import { parseBearer, getUserFromToken } from "../lib/auth.js";

export default async function routes(app) {
  app.post("/api/lineup/submit", async (req, reply) => {
    const body = req.body || {};
    const { tournament_id, picks, tiebreaker } = body;

    if (!tournament_id || typeof tournament_id !== "string") {
      return reply.code(400).send({ ok: false, error: "tournament_id required" });
    }
    if (!picks || typeof picks !== "object") {
      return reply.code(400).send({ ok: false, error: "picks required" });
    }

    const token = parseBearer(req);
    const user = getUserFromToken(token) || { email: "anon@guest", name: "Anonymous" };

    const entry = addEntry({ tournament_id, user, picks, tiebreaker });
    return { ok: true, ...entry };
  });
}
