// routes/tournaments.js
import pkg from "pg";
const { Pool } = pkg;

export default async function tournamentsRoutes(app) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  // ✅ DB-backed endpoint (this should be the one your app uses)
  app.get("/api/tournaments", async (req, reply) => {
    try {
      const { rows } = await pool.query(`
        SELECT 
          id,
          name,
          tour,
          course,
          city,
          country,
          start_date AS "startDate",
          end_date   AS "endDate",
          status
        FROM tournaments
        ORDER BY start_date DESC
      `);
      // return a plain array
      return rows;
    } catch (err) {
      app.log.error(err);
      return reply.code(500).send({ error: "Failed to fetch tournaments" });
    }
  });

  // 🧪 Temporary: demo endpoint so we can compare
  app.get("/api/tournaments_demo", async () => ({
    ok: true,
    tournaments: [
      { id: "demo", name: "Demo Event", tour: "PGA", date: "This Week", field_strength: 72, featured: true },
    ],
  }));
}
