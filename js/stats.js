import { TARGETS, computeState } from './cricket.js';
import { gameMode } from './games.js';

// Winststatistieken. Enkel afgewerkte spellen met minstens 2 spelers tellen mee:
// een solospel is altijd "gewonnen" en zou de percentages vertekenen.

export function isCompetitive(game) {
  return game.status === 'finished' && game.players.length >= 2;
}

export function playerStats(games) {
  const byPlayer = new Map();
  for (const game of games.filter(isCompetitive)) {
    for (const { id, name } of game.players) {
      const s = byPlayer.get(id) ?? { id, name, played: 0, won: 0 };
      s.name = name;
      s.played++;
      if (game.winnerId === id) s.won++;
      byPlayer.set(id, s);
    }
  }
  return [...byPlayer.values()]
    .map((s) => ({ ...s, pct: s.played ? s.won / s.played : 0 }))
    .sort((a, b) => b.pct - a.pct || b.won - a.won || a.name.localeCompare(b.name));
}

export const PERIODS = {
  '7d': '7 dagen',
  '30d': '30 dagen',
  year: 'Dit jaar',
  all: 'Alles',
};

const DAY = 24 * 3600 * 1000;

export function inPeriod(game, period, now = new Date()) {
  const at = new Date(game.finishedAt ?? game.startedAt);
  if (period === '7d') return now - at <= 7 * DAY;
  if (period === '30d') return now - at <= 30 * DAY;
  if (period === 'year') return at.getFullYear() === now.getFullYear();
  return true;
}

function emptyPlayer(id, name) {
  return {
    id, name,
    games: 0, competitive: 0, won: 0,
    marks: 0, gained: 0, dealt: 0, received: 0,
    hits: Object.fromEntries(TARGETS.map((t) => [t, 0])),
    firstClosed: Object.fromEntries(TARGETS.map((t) => [t, 0])),
    results: [], // true/false per competitief spel, chronologisch
    opponents: new Map(), // id → { name, together, won, lost }
  };
}

// Uitgebreide statistieken per speler over afgewerkte spellen.
// Marks en nummers tellen alle afgewerkte spellen (ook solo); winst, reeksen en duels enkel spellen met ≥ 2 spelers.
export function detailedStats(games) {
  const finished = games
    .filter((g) => g.status === 'finished')
    .sort((a, b) => (a.finishedAt ?? a.startedAt).localeCompare(b.finishedAt ?? b.startedAt));
  const byPlayer = new Map();

  for (const game of finished) {
    const ids = game.players.map((p) => p.id);
    const state = computeState(ids, game.events, gameMode(game));
    const competitive = isCompetitive(game);

    for (const { id, name } of game.players) {
      const s = byPlayer.get(id) ?? emptyPlayer(id, name);
      s.name = name;
      s.games++;
      for (const t of TARGETS) {
        s.hits[t] += state.hits[id][t];
        s.marks += state.hits[id][t];
        if (state.firstClosed[t] === id) s.firstClosed[t]++;
      }
      s.gained += state.gained[id];
      s.dealt += state.dealt[id];
      // Ontvangen = punten die anderen bij deze speler aftrokken (enkel cut-throat).
      s.received += state.gained[id] - state.points[id];

      if (competitive) {
        const won = game.winnerId === id;
        s.competitive++;
        if (won) s.won++;
        s.results.push(won);
        for (const other of game.players) {
          if (other.id === id) continue;
          const o = s.opponents.get(other.id) ?? { id: other.id, name: other.name, together: 0, won: 0, lost: 0 };
          o.name = other.name;
          o.together++;
          if (won) o.won++;
          if (game.winnerId === other.id) o.lost++;
          s.opponents.set(other.id, o);
        }
      }
      byPlayer.set(id, s);
    }
  }

  return [...byPlayer.values()]
    .map((s) => ({
      ...s,
      pct: s.competitive ? s.won / s.competitive : null,
      marksPerGame: s.games ? s.marks / s.games : 0,
      currentStreak: currentStreak(s.results),
      bestStreak: bestStreak(s.results),
      opponents: [...s.opponents.values()].sort((a, b) => b.together - a.together || a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1) || b.won - a.won || a.name.localeCompare(b.name));
}

// Positief = aantal gewonnen spellen op rij, negatief = aantal verloren op rij.
function currentStreak(results) {
  if (results.length === 0) return 0;
  const last = results[results.length - 1];
  let n = 0;
  for (let i = results.length - 1; i >= 0 && results[i] === last; i--) n++;
  return last ? n : -n;
}

function bestStreak(results) {
  let best = 0;
  let run = 0;
  for (const won of results) {
    run = won ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}
