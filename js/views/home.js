import { findActiveGame, listPlayers } from '../games.js';
import { esc, formatDate } from '../util.js';

export async function homeView(root) {
  const [active, players] = await Promise.all([findActiveGame(), listPlayers()]);

  let body;
  if (active) {
    body = `
      <p>Spel bezig sinds ${esc(formatDate(active.startedAt))}: ${active.players.map((p) => esc(p.name)).join(', ')}</p>
      <div class="actions">
        <a class="button primary" href="#/game?id=${esc(active.id)}">Verder spelen</a>
        <a class="button" href="#/new">Nieuw spel</a>
      </div>`;
  } else if (players.length === 0) {
    body = `
      <p class="muted">Voeg eerst spelers toe.</p>
      <div class="actions"><a class="button primary" href="#/players">Spelers toevoegen</a></div>`;
  } else {
    body = `<div class="actions"><a class="button primary big" href="#/new">Nieuw spel</a></div>`;
  }

  root.innerHTML = `<section class="card"><h1>Cricket</h1>${body}</section>`;
}
