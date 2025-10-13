// routes/leaderboard.js
import { listEntriesByTournament } from "../data/mock.js";

export default async function routes(app) {
  app.get("/api/leaderboard/:id", async (req, reply) => {
    const { id } = req.params;
    const out = listEntriesByTournament(id);
    return out; // { ok, leaderboard, updated_at }
  });
}
