# scaffold-ltg.ps1
# Creates/updates LTG backend & frontend files with safe backups, AND patches server.js to register admin route.

$BackendRoot  = "C:\Users\kylee\OneDrive\Desktop\ltg-backend"
$FrontendRoot = "C:\Users\kylee\OneDrive\Desktop\ltg-frontend"

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

function Ensure-Dir($p) {
  if (-not (Test-Path $p)) { New-Item -ItemType Directory -Force -Path $p | Out-Null }
}

function Write-FileSafe($Path, $Content) {
  $dir = Split-Path -Parent $Path
  Ensure-Dir $dir
  if (Test-Path $Path) {
    $bak = "$Path.bak.$timestamp"
    Copy-Item $Path $bak -Force
    Write-Host "Backed up existing: $Path -> $bak" -ForegroundColor Yellow
  }
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
  Write-Host "Wrote: $Path" -ForegroundColor Green
}

# ---------- BACKEND ----------
# db/schema.sql
$schemaSql = @'
CREATE TABLE IF NOT EXISTS tournaments (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  tour TEXT DEFAULT 'PGA',
  course TEXT,
  city TEXT,
  country TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'upcoming'
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lineups (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  tournament_id INT REFERENCES tournaments(id) ON DELETE CASCADE,
  picks JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leaderboard (
  id SERIAL PRIMARY KEY,
  tournament_id INT REFERENCES tournaments(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);
'@
Write-FileSafe "$BackendRoot\db\schema.sql" $schemaSql

# scripts/seed-db.js
$seedJs = @'
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import "dotenv/config";
import pkg from "pg";
const { Pool } = pkg;

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const sql = fs.readFileSync(path.join(__dirname, "..", "db", "schema.sql"), "utf8");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: /render\.com|amazonaws|azure|herokuapp/i.test(process.env.DATABASE_URL || "")
    ? { rejectUnauthorized: false }
    : undefined,
});

async function run() {
  await pool.query(sql);
  const seed = await pool.query(`
    INSERT INTO tournaments (name, tour, course, city, country, start_date, end_date, status)
    VALUES
      ('Shriners Children''s Open', 'PGA', 'TPC Summerlin', 'Las Vegas', 'USA', '2025-10-16', '2025-10-19', 'active'),
      ('ZOZO Championship', 'PGA', 'Accordia Golf Narashino CC', 'Chiba', 'Japan', '2025-10-23', '2025-10-26', 'upcoming'),
      ('Sanderson Farms Championship', 'PGA', 'CC of Jackson', 'Jackson', 'USA', '2025-10-09', '2025-10-12', 'completed')
    ON CONFLICT DO NOTHING
    RETURNING id;
  `);
  console.log(`✅ Seed complete. Inserted rows: ${seed.rowCount}`);
  process.exit(0);
}

run().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});
'@
Write-FileSafe "$BackendRoot\scripts\seed-db.js" $seedJs

# routes/admin.js (dev helper)
$adminJs = @'
import pkg from "pg";
const { Pool } = pkg;

export default async function adminRoutes(app) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: /render\.com|amazonaws|azure|herokuapp/i.test(process.env.DATABASE_URL || "")
      ? { rejectUnauthorized: false }
      : undefined,
  });

  app.get("/api/admin/reset", async (req, reply) => {
    const token = req.query.token;
    if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
      return reply.code(401).send({ error: "unauthorized" });
    }
    try {
      await pool.query("TRUNCATE TABLE tournaments RESTART IDENTITY CASCADE;");
      const { rowCount } = await pool.query(`
        INSERT INTO tournaments (name, tour, course, city, country, start_date, end_date, status)
        VALUES
          ('Shriners Children''s Open', 'PGA', 'TPC Summerlin', 'Las Vegas', 'USA', '2025-10-16', '2025-10-19', 'active'),
          ('ZOZO Championship', 'PGA', 'Accordia Golf Narashino CC', 'Chiba', 'Japan', '2025-10-23', '2025-10-26', 'upcoming'),
          ('Sanderson Farms Championship', 'PGA', 'CC of Jackson', 'Jackson', 'USA', '2025-10-09', '2025-10-12', 'completed')
        RETURNING id;
      `);
      return { ok: true, inserted: rowCount };
    } catch (e) {
      app.log.error(e);
      return reply.code(500).send({ error: e.message });
    }
  });
}
'@
Write-FileSafe "$BackendRoot\routes\admin.js" $adminJs

# .env.example
$backendEnv = @'
PORT=3000
DATABASE_URL=postgres://USER:PASS@HOST:PORT/DBNAME
RESEND_API_KEY=
ADMIN_TOKEN=change-this
'@
Write-FileSafe "$BackendRoot\.env.example" $backendEnv

# nodemon.json
$nodemonJson = @'
{
  "watch": ["server.js", "routes", "lib", "db", "scripts"],
  "ext": "js,json,sql",
  "exec": "node server.js"
}
'@
Write-FileSafe "$BackendRoot\nodemon.json" $nodemonJson

# package.json - augment with scripts/deps (non-destructive)
$pkgPath = "$BackendRoot\package.json"
if (Test-Path $pkgPath) {
  $pkg = Get-Content $pkgPath -Raw | ConvertFrom-Json
} else {
  $pkg = [pscustomobject]@{
    name="ltg-backend"; version="1.0.0"; description="LumberTier Golf backend API (Fastify + Postgres)";
    type="module"; main="server.js"; scripts=@{}; dependencies=@{}; engines=@{ node=">=20.0.0" }; license="MIT"
  }
}
if (-not $pkg.scripts) { $pkg | Add-Member scripts @{} }
$pkg.scripts.start = "node server.js"
$pkg.scripts.dev   = "node server.js"
$pkg.scripts.seed  = "node scripts/seed-db.js"
if (-not $pkg.dependencies) { $pkg | Add-Member dependencies @{} }
$pkg.dependencies."@fastify/cors" = $pkg.dependencies."@fastify/cors" ?? "^9.0.1"
$pkg.dependencies."dotenv"        = $pkg.dependencies."dotenv"        ?? "^16.4.5"
$pkg.dependencies."fastify"       = $pkg.dependencies."fastify"       ?? "^4.28.1"
$pkg.dependencies."pg"            = $pkg.dependencies."pg"            ?? "^8.12.0"
$pkg.dependencies."resend"        = $pkg.dependencies."resend"        ?? "^3.3.0"
$pkg.type = "module"
$pkg.engines = @{ node = ">=20.0.0" }
$pkgJson = $pkg | ConvertTo-Json -Depth 100
Write-FileSafe $pkgPath $pkgJson

# README.md
$backendReadme = @'
# LTG Backend

## Setup
1. Copy `.env.example` to `.env` and fill values (`DATABASE_URL`, etc.)
2. Install deps: `npm install`

## Run
- Local: `npm run dev`
- Seed DB: `npm run seed`
- Dev reset (temporary): `/api/admin/reset?token=ADMIN_TOKEN`

## Deploy
Push to `main` — Render auto-deploys.
'@
Write-FileSafe "$BackendRoot\README.md" $backendReadme

# ---------- PATCH server.js to import/register adminRoutes ----------
$serverPath = "$BackendRoot\server.js"
if (Test-Path $serverPath) {
  $server = Get-Content $serverPath -Raw

  # 1) Import line (only if missing)
  if ($server -notmatch 'import\s+adminRoutes\s+from\s+"\.\/routes\/admin\.js";') {
    if ($server -match 'import\s+authRoutes\s+from\s+"\.\/routes\/auth\.js";') {
      $server = $server -replace 'import\s+authRoutes\s+from\s+"\.\/routes\/auth\.js";',
        "import authRoutes from ""./routes/auth.js"";`r`nimport adminRoutes from ""./routes/admin.js"";"
      Write-Host "Patched import for adminRoutes after authRoutes." -ForegroundColor Green
    } else {
      # fallback: insert after other imports
      $server = $server -replace '(\A(?:.|\r|\n)*?dotenv\.config\(\);\s*)',
        '$1' + "`r`nimport adminRoutes from ""./routes/admin.js"";`r`n"
      Write-Host "Inserted import for adminRoutes after dotenv config." -ForegroundColor Green
    }
  } else {
    Write-Host "adminRoutes import already present; skipping." -ForegroundColor Yellow
  }

  # 2) Registration line (only if missing)
  if ($server -notmatch 'await\s+app\.register\(adminRoutes\);') {
    if ($server -match 'await\s+app\.register\(authRoutes\);') {
      $server = $server -replace 'await\s+app\.register\(authRoutes\);',
        "await app.register(authRoutes);`r`nawait app.register(adminRoutes);"
      Write-Host "Patched registration for adminRoutes after authRoutes." -ForegroundColor Green
    } elseif ($server -match 'await\s+app\.register\([^\)]*\);\s*$') {
      # append after the last register line
      $server = $server -replace '(await\s+app\.register\([^\)]*\);\s*)$',
        '$1' + "`r`nawait app.register(adminRoutes);`r`n"
      Write-Host "Appended adminRoutes registration." -ForegroundColor Green
    } else {
      # conservative fallback: insert before listen()
      $server = $server -replace '(try\s*\{)',
        "await app.register(adminRoutes);`r`n`r`n$1"
      Write-Host "Inserted adminRoutes registration before listen()." -ForegroundColor Green
    }
  } else {
    Write-Host "adminRoutes registration already present; skipping." -ForegroundColor Yellow
  }

  Write-FileSafe $serverPath $server
} else {
  Write-Host "WARNING: server.js not found at $serverPath — skipping patch." -ForegroundColor Red
}

# ---------- FRONTEND ----------
# src/lib/api.ts
$apiTs = @'
const BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.lumbertiergolf.com";

export async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { ...init, next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}
'@
Write-FileSafe "$FrontendRoot\src\lib\api.ts" $apiTs

# leaderboard stub
$leaderboardTsx = @'
type Props = { params: { id: string } };

export default function LeaderboardPage({ params }: Props) {
  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-semibold">Leaderboard: {params.id}</h1>
      <p className="text-sm text-zinc-500 mt-2">Coming soon.</p>
    </main>
  );
}
'@
Write-FileSafe "$FrontendRoot\app\leaderboard\[id]\page.tsx" $leaderboardTsx

# lineup stub
$lineupTsx = @'
"use client";
import { useState } from "react";

export default function LineupPage() {
  const [name, setName] = useState("");
  const [picks, setPicks] = useState("");

  const submit = async () => {
    alert("Submit to /api/lineup/submit when backend is ready.");
  };

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Submit Lineup</h1>
      <div className="space-y-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Team name" className="w-full rounded-xl border px-3 py-2" />
        <textarea value={picks} onChange={(e) => setPicks(e.target.value)} placeholder='Enter picks JSON (["p1","p2",...])' className="w-full rounded-xl border p-3 h-40" />
        <button onClick={submit} className="rounded-xl border px-3 py-2 shadow-sm hover:shadow">
          Submit
        </button>
      </div>
    </main>
  );
}
'@
Write-FileSafe "$FrontendRoot\app\lineup\page.tsx" $lineupTsx

# .env.example (frontend)
$frontendEnv = @'
NEXT_PUBLIC_API_URL=https://api.lumbertiergolf.com
'@
Write-FileSafe "$FrontendRoot\.env.example" $frontendEnv

Write-Host "`n✅ Done. Backups created with suffix .bak.$timestamp" -ForegroundColor Cyan
Write-Host "Next steps:"
Write-Host "  1) Backend: cd `"$BackendRoot`"; npm install"
Write-Host "  2) Set env on Render: ADMIN_TOKEN=some-long-string; DATABASE_URL=your Render Postgres URL"
Write-Host "  3) Seed quickly (dev-only): https://api.lumbertiergolf.com/api/admin/reset?token=YOUR_ADMIN_TOKEN" -ForegroundColor DarkGray
Write-Host "  4) Or local seed: npm run seed"

