import { listGames } from '../games.js';
import { TARGETS, targetLabel } from '../cricket.js';
import { detailedStats, inPeriod, PERIODS } from '../stats.js';
import { esc, loadPref, savePref } from '../util.js';

const pct = (v) => (v == null ? '–' : `${Math.round(v * 100)}%`);
const avg = (total, n) => (n ? (total / n).toFixed(1).replace('.', ',') : '–');
const streakSub = (n) => (n > 0 ? 'gewonnen' : n < 0 ? 'verloren' : '');
const streakShort = (n) => (n > 0 ? `${n}W` : n < 0 ? `${-n}V` : '–');

export async function statsView(root) {
  const allGames = await listGames();
  let period = loadPref('statsPeriod', 'all');
  let selectedId = loadPref('statsPlayer', null);

  function render() {
    const stats = detailedStats(allGames.filter((g) => inPeriod(g, period)));
    const selected = stats.find((s) => s.id === selectedId) ?? stats[0];

    root.innerHTML = `
      <section class="card">
        <div class="stats-head">
          <h1>Statistieken</h1>
          <div class="segmented" role="radiogroup" aria-label="Periode">
            ${Object.entries(PERIODS).map(([key, label]) => `
              <label><input type="radio" name="period" value="${key}" ${key === period ? 'checked' : ''}><span>${label}</span></label>`).join('')}
          </div>
        </div>
        ${stats.length === 0 ? '<p class="muted">Nog geen afgewerkte spellen in deze periode.</p>' : overviewTable(stats, selected)}
      </section>
      ${selected ? detail(selected) : ''}
    `;

    for (const r of root.querySelectorAll('input[name=period]')) {
      r.addEventListener('change', () => {
        period = r.value;
        savePref('statsPeriod', period);
        render();
      });
    }
    for (const row of root.querySelectorAll('tr[data-id]')) {
      row.addEventListener('click', () => {
        selectedId = row.dataset.id;
        savePref('statsPlayer', selectedId);
        render();
        root.querySelector('.player-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }

  render();
}

function overviewTable(stats, selected) {
  return `
    <div class="table-wrap">
      <table class="stats clickable">
        <thead><tr>
          <th>Speler</th><th>Spellen</th><th>Gewonnen</th><th>Winst %</th><th>Reeks</th><th>Beste reeks</th><th>Marks/spel</th>
        </tr></thead>
        <tbody>
          ${stats.map((s) => `
            <tr data-id="${esc(s.id)}" class="${s.id === selected?.id ? 'selected' : ''}">
              <td>${esc(s.name)}</td>
              <td>${s.games}</td>
              <td>${s.won}</td>
              <td>${pct(s.pct)}</td>
              <td>${streakShort(s.currentStreak)}</td>
              <td>${s.bestStreak || '–'}</td>
              <td>${avg(s.marks, s.games)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <p class="muted small">Tik op een speler voor details. Winst en reeksen tellen enkel spellen met 2 of meer spelers.</p>`;
}

function detail(s) {
  const maxHits = Math.max(1, ...TARGETS.map((t) => s.hits[t]));
  const favorite = TARGETS.reduce((a, b) => (s.hits[b] > s.hits[a] ? b : a));
  const cutthroat = s.dealt > 0 || s.received > 0;

  const tiles = [
    ['Winst %', pct(s.pct), s.competitive ? `${s.won} van ${s.competitive}` : 'geen duels'],
    ['Huidige reeks', s.currentStreak ? Math.abs(s.currentStreak) : '–', [streakSub(s.currentStreak), s.bestStreak ? `beste ${s.bestStreak}` : ''].filter(Boolean).join(' · ')],
    ['Marks per spel', avg(s.marks, s.games), `${s.marks} in ${s.games} spel${s.games === 1 ? '' : 'len'}`],
    ['Favoriet nummer', s.marks ? targetLabel(favorite) : '–', s.marks ? `${Math.round((s.hits[favorite] / s.marks) * 100)}% van je marks` : ''],
    ['Punten gescoord', avg(s.gained, s.games), 'per spel'],
  ];
  if (cutthroat) {
    tiles.push(['Afgetrokken', avg(s.dealt, s.games), 'per spel, bij anderen']);
    tiles.push(['Ontvangen', avg(s.received, s.games), 'per spel, van anderen']);
  }

  return `
    <section class="card player-detail">
      <h2>${esc(s.name)}</h2>
      <div class="tiles">
        ${tiles.map(([label, value, sub]) => `
          <div class="tile">
            <div class="tile-label">${label}</div>
            <div class="tile-value">${value}</div>
            <div class="tile-sub">${sub}</div>
          </div>`).join('')}
      </div>

      <h3>Marks per nummer</h3>
      <div class="bars" role="table" aria-label="Marks per nummer">
        <div class="bars-head" role="row">
          <span role="columnheader">Nummer</span><span role="columnheader">Marks</span><span role="columnheader" class="num">Eerst dicht</span>
        </div>
        ${TARGETS.map((t) => {
          const share = s.marks ? Math.round((s.hits[t] / s.marks) * 100) : 0;
          return `
            <div class="bar-row" role="row" title="${targetLabel(t)}: ${s.hits[t]} marks (${share}%), ${s.firstClosed[t]}× als eerste gesloten">
              <span class="bar-label" role="cell">${targetLabel(t)}</span>
              <span class="bar-track" role="cell">
                <span class="bar" style="width:${(s.hits[t] / maxHits) * 100}%"></span>
                <span class="bar-value">${s.hits[t]} <span class="muted">· ${share}%</span></span>
              </span>
              <span class="num" role="cell">${s.firstClosed[t]}×</span>
            </div>`;
        }).join('')}
      </div>

      ${s.opponents.length === 0 ? '' : `
        <h3>Tegen andere spelers</h3>
        <div class="table-wrap">
          <table class="stats">
            <thead><tr><th>Tegenstander</th><th>Samen</th><th>Jij won</th><th>Hij/zij won</th></tr></thead>
            <tbody>
              ${s.opponents.map((o) => `
                <tr>
                  <td>${esc(o.name)}</td>
                  <td>${o.together}</td>
                  <td>${o.won}</td>
                  <td>${o.lost}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
        <p class="muted small">Bij 3 of 4 spelers kan ook iemand anders gewonnen hebben.</p>`}
    </section>`;
}
