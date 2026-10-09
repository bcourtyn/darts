import { listPlayers, addPlayer, renamePlayer, deletePlayer, setPlayerActive, isActive } from '../games.js';
import { esc } from '../util.js';

export async function playersView(root) {
  const players = await listPlayers();

  root.innerHTML = `
    <section class="card">
      <h1>Spelers</h1>
      <p class="muted">Vink uit wie (tijdelijk) niet meedoet. Die spelers verschijnen dan niet bij een nieuw spel.</p>
      <ul class="list">
        ${players.map((p) => `
          <li class="row ${isActive(p) ? '' : 'inactive'}" data-id="${esc(p.id)}">
            <label class="toggle" title="Doet mee">
              <input type="checkbox" class="active" ${isActive(p) ? 'checked' : ''} aria-label="Doet mee">
            </label>
            <input class="name" value="${esc(p.name)}" maxlength="20" aria-label="Naam">
            <button class="danger delete">Verwijderen</button>
          </li>`).join('')}
      </ul>
      ${players.length === 0 ? '<p class="muted">Nog geen spelers.</p>' : ''}
      <form class="row add">
        <input name="name" placeholder="Nieuwe speler" maxlength="20" required autocomplete="off">
        <button class="primary">Toevoegen</button>
      </form>
    </section>
  `;

  root.querySelector('form.add').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = e.target.name.value.trim();
    if (!name) return;
    await addPlayer(name);
    playersView(root);
  });

  for (const li of root.querySelectorAll('li[data-id]')) {
    const id = li.dataset.id;
    const input = li.querySelector('.name');
    li.querySelector('.active').addEventListener('change', async (e) => {
      li.classList.toggle('inactive', !e.target.checked);
      await setPlayerActive(id, e.target.checked);
    });
    input.addEventListener('change', async () => {
      if (input.value.trim()) await renamePlayer(id, input.value);
      else input.value = players.find((p) => p.id === id).name;
    });
    li.querySelector('.delete').addEventListener('click', async () => {
      if (!confirm(`${input.value} verwijderen? Gespeelde spellen blijven in de historiek.`)) return;
      await deletePlayer(id);
      playersView(root);
    });
  }
}
