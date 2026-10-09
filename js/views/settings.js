import { exportAll, importAll } from '../db.js';

export async function settingsView(root) {
  const persisted = (await navigator.storage?.persisted?.()) ?? false;

  root.innerHTML = `
    <section class="card">
      <h1>Gegevens</h1>
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
