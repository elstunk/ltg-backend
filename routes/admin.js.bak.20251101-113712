import pkg from "pg";
const { Pool } = pkg;

export default async function adminRoutes(app) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: /render\.com|amazonaws|azure|herokuapp/i.test(process.env.DATABASE_URL || "")
      ? { rejectUnauthorized: false }
      : undefined,
  });

  app.get("/api/admin/reset", async (req, reply) => {
    const token = req.query.token;
    if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
      return reply.code(401).send({ error: "unauthorized" });
    }
    try {
      await pool.query("TRUNCATE TABLE tournaments RESTART IDENTITY CASCADE;");
      const { rowCount } = await pool.query(`
        INSERT INTO tournaments (name, tour, course, city, country, start_date, end_date, status)
        VALUES
          ('Shriners Children''s Open', 'PGA', 'TPC Summerlin', 'Las Vegas', 'USA', '2025-10-16', '2025-10-19', 'active'),
          ('ZOZO Championship', 'PGA', 'Accordia Golf Narashino CC', 'Chiba', 'Japan', '2025-10-23', '2025-10-26', 'upcoming'),
          ('Sanderson Farms Championship', 'PGA', 'CC of Jackson', 'Jackson', 'USA', '2025-10-09', '2025-10-12', 'completed')
        RETURNING id;
      `);
      return { ok: true, inserted: rowCount };
    } catch (e) {
      app.log.error(e);
      return reply.code(500).send({ error: e.message });
    }
  });
}