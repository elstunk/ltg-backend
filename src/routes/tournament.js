/** @param {import('fastify').FastifyInstance} app */
export async function buildTournamentRoutes(app) {
  const pool = app.pg.pool;

  // Health
  app.get('/tournament/health', async () => ({ ok: true, where: 'tournament routes' }));

  // List tournaments
  app.get('/tournaments', async (req, reply) => {
    try {
      // Order by start_date if present; if not, the ORDER BY is ignored by Postgres
      const { rows } = await pool.query(`
        select *
        from tournaments
        order by start_date desc nulls last
        limit 500
      `);
      return rows;
    } catch (err) {
      app.log.error({ err }, 'tournaments query failed');
      reply.code(500);
      return { error: 'tournaments query failed' };
    }
  });

  // One tournament by id
  app.get('/tournaments/:id', async (req, reply) => {
    const { id } = req.params;
    try {
      const { rows } = await pool.query('select * from tournaments where id = $1', [id]);
      if (rows.length === 0) {
        reply.code(404);
        return { error: 'tournament not found' };
      }
      return rows[0];
    } catch (err) {
      app.log.error({ err, id }, 'tournament by id query failed');
      reply.code(500);
      return { error: 'tournament by id query failed' };
    }
  });
}
export default buildTournamentRoutes;
