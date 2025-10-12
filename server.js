import Fastify from 'fastify'
import cors from '@fastify/cors'
import pkg from 'pg'
import dotenv from 'dotenv'
dotenv.config()
const { Pool } = pkg

const app = Fastify({ logger: true })
app.register(cors, { origin: true })
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
app.decorate('pg', { pool })

app.get('/api/health', async ()=>({ ok:true }))
app.get('/api/tournament/:id/research', async (req, reply)=>{
  return {
    meta:{ name:'Demo Event', tour:'PGA' },
    field_strength:{ metric:72, method:'rank-based-v1' },
    player_form:[
      { player_id:'p1', name:'A01 Demo', tier:'A', last8_avg:33.4, last4_trend:0.7, cuts_made:7, top10s:3, top25s:6 },
      { player_id:'p2', name:'B02 Sample', tier:'B', last8_avg:31.9, last4_trend:-0.2, cuts_made:6, top10s:2, top25s:4 }
    ]
  }
})
// --- Magic-link (very simple demo) ---
app.post('/api/auth/request-link', async (req, reply) => {
  const email = (await req.body?.email) || (await req.body?.to);
  if (!email) return reply.code(400).send({error:'email required'});
  const token = Buffer.from(email + '|' + Date.now()).toString('base64url');
  const link = `${process.env.APP_ORIGIN || 'http://localhost:5173'}/auth/callback?token=${token}`;
  // send via Resend
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method:'POST',
      headers:{'Authorization':`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},
      body: JSON.stringify({ from: process.env.SENDER_EMAIL, to: email, subject: 'Your LTG login', html: `<a href="${link}">Click to sign in</a>` })
    });
    if(!r.ok) throw new Error(await r.text());
  } catch(e) { app.log.error(e); }
  return { ok:true };
});

app.get('/api/auth/callback', async (req, reply) => {
  const { token } = req.query;
  if(!token) return reply.code(400).send({error:'bad token'});
  // TODO: verify token & create session cookie
  reply.redirect((process.env.APP_ORIGIN || 'http://localhost:5173') + '/');
});
const port = process.env.PORT || 8080
app.listen({ port, host:'0.0.0.0' }).then(()=> console.log('LTG backend on', port))
