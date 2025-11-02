import { query } from '../lib/db.js'
import { cache } from '../lib/cache.js'

export async function buildTournamentRoutes(app) {
  // Demo research route (stub)
  app.get('/tournament/:id/research', async () => ({
    meta: { name: 'Demo Event', tour: 'PGA' },
    field_strength: { metric: 72, method: 'rank-based-v1' },
    player_form: [
      { player_id: 'p1', name: 'A01 Demo', tier: 'A', last8_avg: 33.4, last4_trend: 0.7, cuts_made: 7, top10s: 3, top25s: 6 },
      { player_id: 'p2', name: 'B02 Sample', tier: 'B', last8_avg: 31.9, last4_trend: -0.2, cuts_made: 6, top10s: 2, top25s: 4 },
    ],
  }))

  // GET /api/tournament/:id
  app.get('/tournament/:id', {
    schema: {
      summary: 'Get tournament metadata',
      params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
    },
  }, async (req) => {
    const key = `tournament:${req.params.id}`
    const memo = cache.get(key)
    if (memo) return memo

    const { rows } = await query(app, `
      SELECT id, name, tour, course, city, country, start_date, end_date, status
      FROM tournaments
      WHERE id = $1
    `, [req.params.id])

    const out = rows[0] || null
    cache.set(key, out, 300_000)
    return out
  })
}
