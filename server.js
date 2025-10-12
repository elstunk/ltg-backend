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

const port = process.env.PORT || 8080
app.listen({ port, host:'0.0.0.0' }).then(()=> console.log('LTG backend on', port))
