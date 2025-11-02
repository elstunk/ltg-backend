// Minimal shim so routes that still import ../lib/db.js will work.
import pkg from 'pg';
const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Optional: tune if you like
  // max: 10,
  // idleTimeoutMillis: 30000,
});
export default pool;
