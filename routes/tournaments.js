// routes/tournaments.js
import pkg from "pg";
const { Pool } = pkg;

export default async function tournamentsRoutes(app) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

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
      // Return plain array for the frontend
      return rows;
    } catch (err) {
      app.log.error(err);
      return reply.code(500).send({ error: "Failed to fetch tournaments" });
    }
  });
}
