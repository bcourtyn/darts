import { TARGETS, MODES, targetLabel, computeState, canMark, isClosedByAll } from '../cricket.js';
import { getGame, saveGame, deleteGame, startGame, listPlayers, gameMode } from '../games.js';
import { navigate } from '../router.js';
import { esc } from '../util.js';
import { currentTheme } from '../themes.js';

const MARK_SVG = [
  '',
  '<svg viewBox="0 0 40 40"><line x1="8" y1="32" x2="32" y2="8"/></svg>',
  '<svg viewBox="0 0 40 40"><line x1="8" y1="32" x2="32" y2="8"/><line x1="8" y1="8" x2="32" y2="32"/></svg>',
  '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="17"/><line x1="10" y1="30" x2="30" y2="10"/><line x1="10" y1="10" x2="30" y2="30"/></svg>',
];

// Inhoud van het scorebord; ook gebruikt voor de themavoorbeelden in Instellingen.
export function boardHtml(state, nameOf, center) {
  const ids = state.playerIds;
  const best = Math.max(...ids.map((id) => state.points[id]));

  const head = ids.map((id, i) => {
    const leader = state.points[id] === best && ids.some((o) => state.points[o] !== best);
    return `
      <div class="phead p${i} ${leader ? 'leader' : ''}" data-p="${esc(id)}">
        <span class="avatar" aria-hidden="true">${esc(nameOf(id).charAt(0).toUpperCase())}</span>
        <div class="pname">${esc(nameOf(id))}</div>
        <div class="ppoints">${state.points[id]}</div>
      </div>`;
  });
  let html = center ? `${head[0]}<div class="corner"></div>${head[1]}` : `<div class="corner"></div>${head.join('')}`;

  for (const t of TARGETS) {
    const label = `<div class="target ${isClosedByAll(state, t) ? 'closed' : ''}">${targetLabel(t)}</div>`;
    const cells = ids.map((id, i) => {
      const m = Math.min(state.marks[id][t], 3);
      const live = canMark(state, id, t);
      return `<button class="cell p${i} ${live ? '' : 'dead'}" data-p="${esc(id)}" data-t="${t}" ${live ? '' : 'disabled'} aria-label="${esc(nameOf(id))} ${targetLabel(t)}">${MARK_SVG[m]}</button>`;
    });
    html += center ? `${cells[0]}${label}${cells[1]}` : `${label}${cells.join('')}`;
  }
  return html;
}

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
    // Sommige thema's zetten bij 2 spelers de nummers in het midden: speler 1 | nummer | speler 2.
    const center = ids.length === 2 && currentTheme().center;
    board.classList.toggle('center', center);
    board.innerHTML = boardHtml(state, nameOf, center);
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
    const before = computeState(ids, game.events, mode);
    if (!canMark(before, p, t)) return;
    game.events.push({ p, t });
    render();
    feedback(before, computeState(ids, game.events, mode), p, t);
    await persist();
  });

  // Korte bevestiging van een tik: vak licht op, zwevend label met het effect, gewijzigde scores pulseren.
  function feedback(before, after, p, t) {
    const cell = board.querySelector(`.cell[data-p="${CSS.escape(p)}"][data-t="${t}"]`);
    const deltas = ids
      .map((id) => ({ id, delta: after.points[id] - before.points[id] }))
      .filter((d) => d.delta !== 0);

    let label;
    if (deltas.length === 0) {
      label = after.marks[p][t] === 3 ? 'dicht' : `${after.marks[p][t]}/3`;
    } else if (deltas[0].delta > 0) {
      label = `+${deltas[0].delta}`;
    } else {
      label = `−${t}${deltas.length > 1 ? ` ×${deltas.length}` : ''}`;
    }

    if (cell) {
      cell.classList.add('hit');
      const pop = document.createElement('span');
      pop.className = `pop ${deltas.length === 0 ? '' : deltas[0].delta > 0 ? 'plus' : 'minus'}`;
      pop.textContent = label;
      cell.append(pop);
    }
    for (const { id, delta } of deltas) {
      board.querySelector(`.phead[data-p="${CSS.escape(id)}"]`)?.classList.add(delta > 0 ? 'gain' : 'loss');
    }
    navigator.vibrate?.(15);
  }

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
