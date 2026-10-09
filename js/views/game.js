import { TARGETS, MODES, targetLabel, computeState, canMark, isClosedByAll } from '../cricket.js';
import { getGame, saveGame, deleteGame, startGame, listPlayers, gameMode } from '../games.js';
import { navigate } from '../router.js';
import { esc } from '../util.js';

const MARK_SVG = [
  '',
  '<svg viewBox="0 0 40 40"><line x1="8" y1="32" x2="32" y2="8"/></svg>',
  '<svg viewBox="0 0 40 40"><line x1="8" y1="32" x2="32" y2="8"/><line x1="8" y1="8" x2="32" y2="32"/></svg>',
  '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="17"/><line x1="10" y1="30" x2="30" y2="10"/><line x1="10" y1="10" x2="30" y2="30"/></svg>',
];

export async function gameView(root, params) {
  const game = await getGame(params.get('id'));
  if (!game) {
    navigate('/');
    return;
  }

  const ids = game.players.map((p) => p.id);
  const nameOf = (id) => game.players.find((p) => p.id === id)?.name ?? '?';
  const mode = gameMode(game);

  root.innerHTML = `
    <div class="game-toolbar">
      <button id="undo">↶ Ongedaan maken</button>
      <span class="mode-badge">${MODES[mode]}</span>
      <button id="stop" class="danger">Stoppen</button>
    </div>
    <div class="board" style="--n:${ids.length}"></div>
    <div class="overlay" hidden></div>
  `;

  const board = root.querySelector('.board');
  const overlay = root.querySelector('.overlay');
  const undoBtn = root.querySelector('#undo');

  function render() {
    const state = computeState(ids, game.events, mode);
    const best = Math.max(...ids.map((id) => state.points[id]));

    let html = '<div class="corner"></div>';
    for (const id of ids) {
      const leader = state.points[id] === best && ids.some((o) => state.points[o] !== best);
      html += `
        <div class="phead ${leader ? 'leader' : ''}">
          <div class="pname">${esc(nameOf(id))}</div>
          <div class="ppoints">${state.points[id]}</div>
        </div>`;
    }
    for (const t of TARGETS) {
      html += `<div class="target ${isClosedByAll(state, t) ? 'closed' : ''}">${targetLabel(t)}</div>`;
      for (const id of ids) {
        const m = Math.min(state.marks[id][t], 3);
        const live = canMark(state, id, t);
        html += `<button class="cell ${live ? '' : 'dead'}" data-p="${esc(id)}" data-t="${t}" ${live ? '' : 'disabled'} aria-label="${esc(nameOf(id))} ${targetLabel(t)}">${MARK_SVG[m]}</button>`;
      }
    }
    board.innerHTML = html;
    undoBtn.disabled = game.events.length === 0;
    renderOverlay(state);
  }

  function renderOverlay(state) {
    if (!state.winnerId) {
      overlay.hidden = true;
      return;
    }
    const solo = ids.length === 1;
    overlay.hidden = false;
    overlay.innerHTML = `
      <div class="card winner">
        <div class="trophy">🏆</div>
        <h1>${solo ? 'Alles gesloten!' : `${esc(nameOf(state.winnerId))} wint!`}</h1>
        ${solo ? '' : `<p class="muted">${ids.map((id) => `${esc(nameOf(id))}: ${state.points[id]}`).join(' · ')}</p>`}
        <div class="actions center">
          <button class="primary big" id="again">Nog een spel</button>
          <button id="undo-win">↶ Ongedaan maken</button>
          <a class="button" href="#/history">Historiek</a>
        </div>
      </div>`;
    overlay.querySelector('#undo-win').addEventListener('click', undo);
    overlay.querySelector('#again').addEventListener('click', async () => {
      const roster = new Map((await listPlayers()).map((p) => [p.id, p]));
      // Huidige namen gebruiken als de speler nog bestaat, anders de naam uit dit spel.
      const next = await startGame(game.players.map((p) => roster.get(p.id) ?? p), mode);
      navigate(`/game?id=${next.id}`);
    });
  }

  async function persist() {
    const state = computeState(ids, game.events, mode);
    game.winnerId = state.winnerId;
    game.status = state.winnerId ? 'finished' : 'active';
    game.finishedAt = state.winnerId ? (game.finishedAt ?? new Date().toISOString()) : null;
    await saveGame(game);
  }

  async function undo() {
    if (game.events.length === 0) return;
    game.events.pop();
    game.finishedAt = null;
    await persist();
    render();
  }

  board.addEventListener('click', async (e) => {
    const cell = e.target.closest('.cell');
    if (!cell || cell.disabled) return;
    const p = cell.dataset.p;
    const t = Number(cell.dataset.t);
    if (!canMark(computeState(ids, game.events, mode), p, t)) return;
    game.events.push({ p, t });
    render();
    await persist();
  });

  undoBtn.addEventListener('click', undo);

  root.querySelector('#stop').addEventListener('click', async () => {
    if (game.status === 'active') {
      if (!confirm('Spel stoppen? Dit spel wordt niet bewaard.')) return;
      await deleteGame(game.id);
    }
    navigate('/');
  });

  render();
}
