// scripts/migrate-db.js
import "dotenv/config";
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: /render\.com|amazonaws|azure|herokuapp/i.test(process.env.DATABASE_URL || "")
    ? { rejectUnauthorized: false }
    : undefined,
});

async function migrate() {
  console.log("🚀 Running DB migrations...");

  // --- create tournaments table if missing ---
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tournaments (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      tour TEXT,
      course TEXT,
      city TEXT,
      country TEXT,
      start_date DATE,
      end_date DATE,
      status TEXT
    );
  `);

  // --- add unique index for deduplication ---
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS uq_tournaments_name_tour_start
      ON tournaments (name, tour, start_date);
  `);

  // --- future migrations can go here ---
  console.log("✅ Migrations complete.");
  process.exit(0);
}

migrate().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
