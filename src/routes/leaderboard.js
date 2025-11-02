/** @param {import('fastify').FastifyInstance} app */
export async function buildLeaderboardRoutes(app) {
  const pool = app.pg.pool;

  // Health
  app.get('/leaderboard/health', async () => ({ ok: true, where: 'leaderboard routes' }));

  // Leaderboard for a tournament
  // Adjust table/columns to your schema; this query is intentionally generic.
  app.get('/leaderboard/:tournamentId', async (req, reply) => {
    const { tournamentId } = req.params;
    try {
      // If your schema uses different names, change the FROM/WHERE accordingly.
      const { rows } = await pool.query(
        'select * from leaderboard where tournament_id = $1',
        [tournamentId]
      );
      return rows;
    } catch (err) {
      app.log.error({ err, tournamentId }, 'leaderboard query failed');
      reply.code(500);
      return { error: 'leaderboard query failed' };
    }
  });
}

// Export default too (your server.js supports default or named)
export default buildLeaderboardRoutes;
