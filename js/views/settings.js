import { exportAll, importAll } from '../db.js';
import { THEMES, currentTheme, applyTheme } from '../themes.js';
import { esc } from '../util.js';
import { computeState, MODES } from '../cricket.js';
import { boardHtml } from './game.js';
import { currentVersion } from '../update.js';

// Voorbeeldspel voor de themakiezer: Bert staat duidelijk voor op Matthias.
const PREVIEW_PLAYERS = { m: 'Matthias', b: 'Bert' };
const PREVIEW_EVENTS = [
  ...Array(6).fill({ p: 'b', t: 20 }),
  ...Array(3).fill({ p: 'b', t: 19 }),
  ...Array(2).fill({ p: 'b', t: 18 }),
  ...Array(3).fill({ p: 'b', t: 16 }),
  { p: 'b', t: 25 },
  ...Array(2).fill({ p: 'm', t: 20 }),
  { p: 'm', t: 19 },
  ...Array(4).fill({ p: 'm', t: 17 }),
  { p: 'm', t: 15 },
];

// Volledig HTML-document voor één voorbeeld; draait in een iframe zodat het thema niet uitlekt naar de pagina.
function previewDoc(theme) {
  const state = computeState(['m', 'b'], PREVIEW_EVENTS, 'standard');
  const board = boardHtml(state, (id) => PREVIEW_PLAYERS[id], theme.center);
  return `<!doctype html>
<html lang="nl" data-theme="${theme.id}">
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="css/app.css">
  <link rel="stylesheet" href="css/themes.css">
  <style>body { overflow: hidden; } main { padding: 8px 12px; max-width: none; } .board { height: 360px; min-height: 0; }</style>
</head>
<body data-view="game">
  <header class="topbar"><span class="brand">🎯 Darts Cricket</span><nav><span>Spelers</span><span>Historiek</span><span>Statistieken</span></nav></header>
  <main>
    <div class="game-toolbar"><button>↶ Ongedaan maken</button><span class="mode-badge">${MODES.standard}</span><button class="danger">Stoppen</button></div>
    <div class="board ${theme.center ? 'center' : ''}" style="--n:2">${board}</div>
  </main>
</body>
</html>`;
}

export async function settingsView(root) {
  const persisted = (await navigator.storage?.persisted?.()) ?? false;
  const active = currentTheme();

  root.innerHTML = `
    <section class="card">
      <h1>Thema</h1>
      <p class="muted">Kies hoe de app eruitziet. De keuze geldt enkel voor dit toestel.</p>
      <div class="theme-grid" role="radiogroup" aria-label="Thema">
        ${THEMES.map((t) => `
          <label class="theme-option">
            <input type="radio" name="theme" value="${esc(t.id)}" ${t.id === active.id ? 'checked' : ''}>
            <span class="theme-frame">
              <iframe srcdoc="${esc(previewDoc(t))}" tabindex="-1" aria-hidden="true" loading="lazy"></iframe>
            </span>
            <span class="theme-name">${esc(t.name)}</span>
          </label>`).join('')}
      </div>
    </section>
    <section class="card">
      <h2>Gegevens</h2>
      <p class="muted">Alle gegevens staan enkel op dit toestel. Exporteer ze als backup of om ze naar een ander toestel over te zetten.</p>
      <div class="actions">
        <button id="export">Exporteren</button>
        <button id="import">Importeren</button>
        <input id="file" type="file" accept="application/json,.json" hidden>
      </div>
      <p id="status" class="muted"></p>
    </section>
    <section class="card">
      <h2>Opslag</h2>
      <p class="muted">Blijvende opslag: ${persisted ? 'ja' : 'nee (installeer de app op het beginscherm)'}</p>
    </section>
    <section class="card">
      <h2>Over de app</h2>
      <p class="muted">Versie: <strong id="app-version">…</strong></p>
    </section>
  `;

  for (const radio of root.querySelectorAll('input[name=theme]')) {
    radio.addEventListener('change', () => applyTheme(radio.value));
  }

  // De voorbeelden zijn 640×480 en worden geschaald tot de breedte van hun kader.
  const frames = [...root.querySelectorAll('.theme-frame')];
  const fit = () => frames.forEach((f) => f.style.setProperty('--preview-scale', f.clientWidth / 640));
  fit();
  new ResizeObserver(fit).observe(root.querySelector('.theme-grid'));
  currentVersion().then((v) => {
    root.querySelector('#app-version').textContent = v ?? 'onbekend (geen offline-versie actief)';
  });

  const status = root.querySelector('#status');
  const fileInput = root.querySelector('#file');

  root.querySelector('#export').addEventListener('click', async () => {
    const data = await exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `darts-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    status.textContent = 'Export klaar.';
  });

  root.querySelector('#import').addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;
    try {
      await importAll(JSON.parse(await file.text()));
      status.textContent = 'Import geslaagd.';
    } catch (err) {
      status.textContent = `Import mislukt: ${err.message}`;
    }
    fileInput.value = '';
  });
}
