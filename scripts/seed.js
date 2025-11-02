import pkg from 'pg';
const { Pool } = pkg;

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('Missing DATABASE_URL');
  process.exit(1);
}

// If your DB requires SSL (e.g., Render/Neon/etc.)
const pool = new Pool({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const c = await pool.connect();
  try {
    await c.query('BEGIN');

    // Players
    await c.query(`
      INSERT INTO players (player_id, name, country, hand, world_rank) VALUES
        ('p1','Scottie Scheffler','USA','R',1),
        ('p2','Rory McIlroy','NIR','R',2),
        ('p3','Xander Schauffele','USA','R',3)
      ON CONFLICT (player_id) DO NOTHING;
    `);

    // Tournaments: integer id = 1
    await c.query(`
      INSERT INTO tournaments (id, name, tour, course, city, country, start_date, end_date, status) VALUES
        (1,'Demo Championship','PGA','Demo National','Austin','USA','2025-11-06','2025-11-09','upcoming')
      ON CONFLICT (id) DO NOTHING;
    `);

 // Leaderboard (for tournament_id = 1)
const r = await c.query(`
  INSERT INTO leaderboard (tournament_id, data)
  VALUES (1, '{}'::jsonb)
  ON CONFLICT DO NOTHING
  RETURNING id;
`);


    const lid =
      r.rows[0]?.id ??
      (
        await c.query(
          'SELECT id FROM leaderboard WHERE tournament_id = $1 ORDER BY id DESC LIMIT 1',
          [1]
        )
      ).rows[0].id;

    // Leaderboard entries
    await c.query(
      `
      INSERT INTO leaderboard_entries
        (leaderboard_id, player_id, pos, pos_sort, score, thru, today)
      VALUES
        ($1,'p1','1',1,-6,'F',-6),
        ($1,'p2','2',2,-4,'F',-4),
        ($1,'p3','3',3,-3,'F',-3)
      ON CONFLICT DO NOTHING;
    `,
      [lid]
    );

    await c.query('COMMIT');
    console.log('✅ Seed complete');
  } catch (e) {
    await c.query('ROLLBACK');
    console.error(e);
    process.exit(1);
  } finally {
    c.release();
    await pool.end();
  }
}

main();
