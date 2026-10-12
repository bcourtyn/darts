import { exportAll, importAll } from '../db.js';
import { THEMES, currentTheme, applyTheme } from '../themes.js';
import { esc } from '../util.js';

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
            <span class="theme-swatch" style="background:${t.swatch[0]}">
              <span style="background:${t.swatch[1]}"></span>
              <span style="background:${t.swatch[2]}"></span>
              <span style="background:${t.swatch[3]}"></span>
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
  `;

  for (const radio of root.querySelectorAll('input[name=theme]')) {
    radio.addEventListener('change', () => applyTheme(radio.value));
  }
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
