import Fastify from 'fastify'
import cors from '@fastify/cors'
import pkg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

const { Pool } = pkg

// ---- Origins (set these in Render env too) ----
const API_ORIGIN = process.env.API_ORIGIN || 'https://ltg-backend.onrender.com'
const APP_ORIGIN = process.env.APP_ORIGIN || 'https://ltg-frontend.vercel.app'

// ---- App setup ----
const app = Fastify({ logger: true })
app.register(cors, { origin: true })

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
app.decorate('pg', { pool })

// Root (avoid 404 noise)
app.get('/', async () => ({ ok: true, name: 'LTG backend' }))

// Health
app.get('/api/health', async () => ({ ok: true }))

// Demo data
app.get('/api/tournament/:id/research', async (req, reply) => {
  return {
    meta: { name: 'Demo Event', tour: 'PGA' },
    field_strength: { metric: 72, method: 'rank-based-v1' },
    player_form: [
      { player_id: 'p1', name: 'A01 Demo', tier: 'A', last8_avg: 33.4, last4_trend: 0.7, cuts_made: 7, top10s: 3, top25s: 6 },
      { player_id: 'p2', name: 'B02 Sample', tier: 'B', last8_avg: 31.9, last4_trend: -0.2, cuts_made: 6, top10s: 2, top25s: 4 }
    ]
  }
})

// ---- Magic-link (demo) ----
app.post('/api/auth/request-link', async (req, reply) => {
  const email = req.body?.email || req.body?.to
  if (!email) return reply.code(400).send({ error: 'email required' })

  // encode a simple token (for demo; replace with proper JWT later)
  const token = Buffer.from(`${email}|${Date.now()}`).toString('base64url')

  // IMPORTANT: link to the BACKEND callback first
  const link = `${API_ORIGIN}/api/auth/callback?token=${token}`

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: process.env.SENDER_EMAIL, // must be allowed by Resend
        to: email,
        subject: 'Your LTG login',
        html: `<p><a href="${link}">Click here to sign in</a></p>`
      })
    })
    if (!r.ok) {
      const text = await r.text()
      throw new Error(text)
    }
  } catch (e) {
    app.log.error(e)
    // still return ok to avoid leaking details to the client in demo
  }

  return { ok: true }
})

// After clicking the email link, land here; then we send the user to the app
app.get('/api/auth/callback', async (req, reply) => {
  try {
    const { token } = req.query
    // TODO: verify token; set cookie/session if needed
    return reply.redirect(`${APP_ORIGIN}/auth/success`)
  } catch (err) {
    req.log.error(err)
    return reply.redirect(`${APP_ORIGIN}/auth/error`)
  }
})

const port = process.env.PORT || 8080
app.listen({ port, host: '0.0.0.0' }).then(() => {
  console.log('LTG backend on', port)
})
