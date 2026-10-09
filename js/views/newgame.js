import { listPlayers, startGame, findActiveGame, deleteGame, isActive, MIN_PLAYERS, MAX_PLAYERS } from '../games.js';
import { MODES, DEFAULT_MODE } from '../cricket.js';
import { navigate } from '../router.js';
import { esc, loadPref, savePref } from '../util.js';

export async function newGameView(root) {
  const players = (await listPlayers()).filter(isActive);

  // Doen er hoogstens 4 spelers mee, dan staan ze allemaal aangevinkt; anders de vorige keuze.
  let selected;
  if (players.length <= MAX_PLAYERS) {
    selected = new Set(players.map((p) => p.id));
  } else {
    const last = new Set(loadPref('lastPlayers', []));
    selected = new Set(players.filter((p) => last.has(p.id)).slice(0, MAX_PLAYERS).map((p) => p.id));
  }

  if (players.length === 0) {
    root.innerHTML = `
      <section class="card">
        <h1>Nieuw spel</h1>
        <p class="muted">Er zijn geen spelers die meedoen. Voeg spelers toe of vink ze aan bij Spelers.</p>
        <div class="actions"><a class="button primary" href="#/players">Spelers</a></div>
      </section>`;
    return;
  }

  root.innerHTML = `
    <section class="card">
      <h1>Wie speelt mee?</h1>
      <p class="muted">Kies ${MIN_PLAYERS} tot ${MAX_PLAYERS} spelers.</p>
      <div class="pick">
        ${players.map((p) => `
          <label class="pick-player">
            <input type="checkbox" value="${esc(p.id)}" ${selected.has(p.id) ? 'checked' : ''}>
            <span>${esc(p.name)}</span>
          </label>`).join('')}
      </div>
      <h2>Variant</h2>
      <div class="segmented">
        ${Object.entries(MODES).map(([key, label]) => `
          <label><input type="radio" name="mode" value="${key}" ${key === DEFAULT_MODE ? 'checked' : ''}><span>${label}</span></label>`).join('')}
      </div>
      <p class="muted small" id="mode-help"></p>
      <div class="actions">
        <button class="primary big" id="start">Start</button>
        <a class="button" href="#/players">Spelers beheren</a>
      </div>
    </section>
  `;

  const boxes = [...root.querySelectorAll('input[type=checkbox]')];
  const radios = [...root.querySelectorAll('input[name=mode]')];
  const help = root.querySelector('#mode-help');
  const start = root.querySelector('#start');

  const selectedMode = () => radios.find((r) => r.checked)?.value ?? DEFAULT_MODE;

  function updateHelp() {
    help.textContent = selectedMode() === 'cutthroat'
      ? 'Extra marks op een gesloten nummer: ben je de enige die het sloot, dan zijn het punten voor jezelf. Sloten anderen het ook, dan gaan ze af van wie het nog open heeft. Meeste punten wint.'
      : 'Extra marks op een gesloten nummer zijn punten voor jezelf. Meeste punten wint.';
  }

  function update() {
    const count = boxes.filter((b) => b.checked).length;
    for (const b of boxes) b.disabled = !b.checked && count >= MAX_PLAYERS;
    start.disabled = count < MIN_PLAYERS;
  }
  boxes.forEach((b) => b.addEventListener('change', update));
  radios.forEach((r) => r.addEventListener('change', updateHelp));
  update();
  updateHelp();

  start.addEventListener('click', async () => {
    const ids = boxes.filter((b) => b.checked).map((b) => b.value);
    const active = await findActiveGame();
    if (active) {
      if (!confirm('Er is nog een spel bezig. Dat spel wordt afgebroken en niet bewaard. Doorgaan?')) return;
      await deleteGame(active.id);
    }
    savePref('lastPlayers', ids);
    const game = await startGame(players.filter((p) => ids.includes(p.id)), selectedMode());
    navigate(`/game?id=${game.id}`);
  });
}
