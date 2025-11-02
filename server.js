// server.js
import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import pkg from 'pg';
import dotenv from 'dotenv';

import { buildPlayerRoutes } from './src/routes/player.js';
import { buildTournamentRoutes } from './src/routes/tournament.js';
import * as leaderboardMod from './src/routes/leaderboard.js';

dotenv.config();
const { Pool } = pkg;

// 1) Create app first
const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV === 'production' ? undefined : { target: 'pino-pretty' },
  },
});

// 2) ONE pool only, then decorate
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
app.decorate('pg', { pool });

// Log each registered route
app.addHook('onRoute', (routeOpts) => {
  app.log.info({ method: routeOpts.method, url: routeOpts.url }, 'route added');
});

// Core plugins
await app.register(cors, { origin: true });
await app.register(swagger, { openapi: { info: { title: 'Fantasy Golf API', version: '1.0.0' } } });
await app.register(swaggerUi, { routePrefix: '/docs' });

// Health
app.get('/api/health', async () => ({ ok: true }));

// Routes
await app.register(buildPlayerRoutes, { prefix: '/api' });
await app.register(buildTournamentRoutes, { prefix: '/api' });

// Leaderboard plugin (default or named)
app.log.info('[boot] resolving leaderboard plugin export');
app.log.info('[boot] leaderboard module keys: ' + Object.keys(leaderboardMod).join(', '));
const leaderboardPlugin = leaderboardMod.default ?? leaderboardMod.buildLeaderboardRoutes;
if (!leaderboardPlugin) throw new Error('src/routes/leaderboard.js must export default or buildLeaderboardRoutes');
await app.register(leaderboardPlugin, { prefix: '/api' });

// Listen with fallback
const portBase = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';

try {
  await app.listen({ port: portBase, host });
  app.log.info({ port: portBase, host }, 'API listening');
} catch (err) {
  if (err?.code === 'EADDRINUSE') {
    const nextPort = portBase + 1;
    app.log.warn(`Port ${portBase} in use — retrying on ${nextPort}`);
    await app.listen({ port: nextPort, host });
    app.log.info({ port: nextPort, host }, 'API listening');
  } else {
    app.log.error(err);
    process.exit(1);
  }
}

app.ready().then(() => {
  app.log.info('--- ROUTES ---');
  app.printRoutes({ includeHooks: false });
});
