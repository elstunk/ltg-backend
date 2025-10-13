export const tournaments = [
  { id: "demo", name: "Demo Event", tour: "PGA", date: "This Week", field_strength: 72, featured: true },
];

export const researchByTournament = {
  demo: {
    meta: { name: "Demo Event", tour: "PGA" },
    field_strength: { metric: 72, method: "rank-based-v1" },
    player_form: [
      { player_id: "p1", name: "A01 Demo", tier: "A", last8_avg: 33.4, last4_trend: 0.7, cuts_made: 7, top10s: 3, top25s: 6 },
      { player_id: "p2", name: "B02 Sample", tier: "B", last8_avg: 31.9, last4_trend: -0.2, cuts_made: 6, top10s: 2, top25s: 5 },
      { player_id: "p3", name: "C03 Test", tier: "C", last8_avg: 29.2, last4_trend: 0.4, cuts_made: 5, top10s: 1, top25s: 4 },
      { player_id: "p4", name: "D04 Try", tier: "D", last8_avg: 27.8, last4_trend: -0.1, cuts_made: 4, top10s: 0, top25s: 3 },
    ],
  },
};

// In-memory store for entries (replace with DB later)
const _entries = []; // { entry_id, tournament_id, user, picks, tiebreaker, total, created_at }

export function addEntry({ tournament_id, user, picks, tiebreaker }) {
  const entry_id = `e${_entries.length + 1}`;
  const created_at = new Date().toISOString();
  const total = 0; // mock score

  _entries.push({ entry_id, tournament_id, user, picks, tiebreaker, total, created_at });
  return { entry_id };
}

export function listEntriesByTournament(tournament_id) {
  const items = _entries.filter(e => e.tournament_id === tournament_id);
  const sorted = [...items].sort((a, b) => (a.total ?? 0) - (b.total ?? 0));

  let rank = 1;
  const leaderboard = sorted.map((e, i) => {
    if (i > 0 && (sorted[i - 1].total ?? 0) !== (e.total ?? 0)) rank = i + 1;
    return {
      entry_id: e.entry_id,
      user: e.user,
      total: e.total,
      rank,
      tiebreaker: e.tiebreaker ?? null,
      picks: e.picks,
    };
  });

  return { ok: true, leaderboard, updated_at: new Date().toISOString() };
}

