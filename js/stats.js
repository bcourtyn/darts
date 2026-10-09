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
