// scripts/dedupe-db.js
import "dotenv/config";
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: /render\.com|amazonaws|azure|herokuapp/i.test(process.env.DATABASE_URL || "")
    ? { rejectUnauthorized: false }
    : undefined,
});

async function run() {
  // 1) remove duplicate rows (keep the earliest id)
  const del = await pool.query(`
    WITH ranked AS (
      SELECT id,
             ROW_NUMBER() OVER (
               PARTITION BY name, tour, start_date
               ORDER BY id
             ) AS rn
      FROM tournaments
    )
    DELETE FROM tournaments t
    USING ranked r
    WHERE t.id = r.id
      AND r.rn > 1;
  `);
  console.log("Removed duplicate rows: " + del.rowCount);

  // 2) enforce idempotency going forward
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS uq_tournaments_name_tour_start
      ON tournaments (name, tour, start_date);
  `);
  console.log("Unique index ensured: uq_tournaments_name_tour_start");
  process.exit(0);
}

run().catch((e) => {
  console.error("Dedupe failed:", e);
  process.exit(1);
});
