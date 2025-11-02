/** @param {import('fastify').FastifyInstance} app */
export async function buildPlayerRoutes(app) {
  const pool = app.pg.pool;

  app.get('/player/health', async () => ({ ok: true, where: 'player routes' }));

  app.get('/players', async (req, reply) => {
    try {
      const { rows } = await pool.query('select * from players limit 200');
      return rows;
    } catch (err) {
      app.log.error({ err }, 'players query failed');
      reply.code(500);
      return { error: 'players query failed' };
    }
  });

  app.get('/players/:id', async (req, reply) => {
    const { id } = req.params;
    try {
      const { rows } = await pool.query('select * from players where id = $1', [id]);
      if (rows.length === 0) {
        reply.code(404);
        return { error: 'player not found' };
      }
      return rows[0];
    } catch (err) {
      app.log.error({ err, id }, 'player by id query failed');
      reply.code(500);
      return { error: 'player by id query failed' };
    }
  });
}
export default buildPlayerRoutes;
