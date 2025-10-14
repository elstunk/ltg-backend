import Fastify from "fastify";
import cors from "@fastify/cors";
import dotenv from "dotenv";
dotenv.config();

import tournamentsRoutes from "./routes/tournaments.js";
import leaderboardRoutes from "./routes/leaderboard.js";
import lineupRoutes from "./routes/lineup.js";
import authRoutes from "./routes/auth.js";

const app = Fastify({ logger: true });
app.get("/", async () => ({
  ok: true,
  name: "ltg-backend",
  endpoints: [
    "/api/health",
    "/api/tournaments",
    "/api/leaderboard/:id",
    "/api/lineup/submit",
    "/api/auth/request-link",
    "/api/auth/verify-link"
  ]
}));


// allow your Vite dev server + prod site
await app.register(cors, { origin: true });

app.get("/api/health", async () => ({ ok: true }));

await app.register(tournamentsRoutes);
await app.register(leaderboardRoutes);
await app.register(lineupRoutes);
await app.register(authRoutes);

const PORT = process.env.PORT || 3000;
try {
  await app.listen({ port: PORT, host: "0.0.0.0" });
  console.log(`✅ API running on http://localhost:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
