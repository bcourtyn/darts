import { listGames, deleteGame, gameMode } from '../games.js';
import { computeState, MODES } from '../cricket.js';
import { playerStats } from '../stats.js';
import { esc, formatDate } from '../util.js';

export async function historyView(root) {
  const games = (await listGames()).filter((g) => g.status === 'finished');
  const stats = playerStats(games);

  root.innerHTML = `
    <section class="card">
      <h1>Klassement</h1>
      ${stats.length === 0
        ? '<p class="muted">Nog geen afgewerkte spellen met 2 of meer spelers.</p>'
        : `<table class="stats">
            <thead><tr><th>Speler</th><th>Gespeeld</th><th>Gewonnen</th><th>Winst %</th></tr></thead>
            <tbody>
              ${stats.map((s) => `
                <tr>
                  <td>${esc(s.name)}</td>
                  <td>${s.played}</td>
                  <td>${s.won}</td>
                  <td>${Math.round(s.pct * 100)}%</td>
                </tr>`).join('')}
            </tbody>
          </table>`}
      <p class="muted small">Solospellen tellen niet mee in het klassement.</p>
    </section>
    <section class="card">
      <h2>Gespeelde spellen</h2>
      ${games.length === 0 ? '<p class="muted">Nog geen spellen gespeeld.</p>' : `<ul class="list">${games.map(gameItem).join('')}</ul>`}
    </section>
  `;

  for (const btn of root.querySelectorAll('[data-delete]')) {
    btn.addEventListener('click', async () => {
      if (!confirm('Dit spel uit de historiek verwijderen?')) return;
      await deleteGame(btn.dataset.delete);
      historyView(root);
    });
  }
}

function gameItem(game) {
  const ids = game.players.map((p) => p.id);
  const state = computeState(ids, game.events, gameMode(game));
  const scores = game.players
    .map((p) => {
      const name = esc(p.name);
      const label = p.id === game.winnerId ? `<strong>🏆 ${name}</strong>` : name;
      return ids.length > 1 ? `${label} ${state.points[p.id]}` : label;
    })
    .join(' · ');
  return `
    <li class="row">
      <div class="grow">
        <div>${scores}</div>
        <div class="muted small">${esc(formatDate(game.startedAt))} · ${ids.length === 1 ? 'solo' : MODES[gameMode(game)]}</div>
      </div>
      <button class="icon" data-delete="${esc(game.id)}" aria-label="Verwijderen">✕</button>
    </li>`;
}
