// scripts/migrate-db.js
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import pkg from "pg";
const { Pool } = pkg;

const MIGRATIONS_DIR = path.join(process.cwd(), "migrations");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: /render\.com|amazonaws|azure|herokuapp/i.test(process.env.DATABASE_URL || "")
    ? { rejectUnauthorized: false }
    : undefined,
});

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

function listMigrations() {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
}

async function appliedSet() {
  const { rows } = await pool.query(`SELECT filename FROM schema_migrations`);
  return new Set(rows.map((r) => r.filename));
}

async function applyMigration(client, filename) {
  const full = path.join(MIGRATIONS_DIR, filename);
  const sql = fs.readFileSync(full, "utf8");
  console.log(`→ Applying ${filename} ...`);
  await client.query("BEGIN");
  try {
    await client.query(sql);
    await client.query(`INSERT INTO schema_migrations (filename) VALUES ($1)`, [filename]);
    await client.query("COMMIT");
    console.log(`✓ Applied ${filename}`);
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(`✗ Failed ${filename}:`, e.message);
    throw e;
  }
}

async function migrate() {
  console.log("🚀 Running DB migrations...");
  await ensureTable();
  const all = listMigrations();
  const done = await appliedSet();
  const pending = all.filter((f) => !done.has(f));

  if (pending.length === 0) {
    console.log("✅ No migrations to run.");
    return;
  }

  const client = await pool.connect();
  try {
    for (const f of pending) {
      await applyMigration(client, f);
    }
    console.log("🎉 Migrations complete.");
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error("❌ Migration run failed:", err);
  process.exit(1);
});
