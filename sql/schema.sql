-- players
CREATE TABLE IF NOT EXISTS players (
  player_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT,
  hand TEXT,
  world_rank INT
);

-- tournaments
CREATE TABLE IF NOT EXISTS tournaments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tour TEXT NOT NULL,
  course TEXT,
  city TEXT,
  country TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT
);

-- leaderboard snapshot (optional live)
CREATE TABLE IF NOT EXISTS leaderboard (
  id BIGSERIAL PRIMARY KEY,
  tournament_id TEXT REFERENCES tournaments(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id BIGSERIAL PRIMARY KEY,
  leaderboard_id BIGINT REFERENCES leaderboard(id) ON DELETE CASCADE,
  player_id TEXT REFERENCES players(player_id),
  pos TEXT,
  pos_sort INT,
  score INT,
  thru TEXT,
  today INT
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_tournament
ON leaderboard(tournament_id);
