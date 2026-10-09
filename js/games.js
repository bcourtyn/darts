// Opslag van spelers en spellen bovenop db.js.
import { getAll, get, put, remove, newId } from './db.js';

export const MIN_PLAYERS = 1;
export const MAX_PLAYERS = 4;

export async function listPlayers() {
  return (await getAll('players')).sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.name.localeCompare(b.name));
}

// Spelers die (tijdelijk) niet meedoen blijven bewaard maar verschijnen niet bij een nieuw spel.
export function isActive(player) {
  return player.active !== false;
}

export async function setPlayerActive(id, active) {
  const player = await get('players', id);
  if (!player) return;
  player.active = active;
  await put('players', player);
}

export async function addPlayer(name) {
  const player = { id: newId(), name: name.trim(), active: true, createdAt: new Date().toISOString() };
  await put('players', player);
  return player;
}

export async function renamePlayer(id, name) {
  const player = await get('players', id);
  if (!player) return;
  player.name = name.trim();
  await put('players', player);
}

// Verwijdert de speler uit de lijst; gespeelde spellen bewaren hun eigen kopie van de naam.
export function deletePlayer(id) {
  return remove('players', id);
}

export async function listGames() {
  return (await getAll('games')).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export async function findActiveGame() {
  return (await listGames()).find((g) => g.status === 'active') ?? null;
}

export function getGame(id) {
  return get('games', id);
}

export function saveGame(game) {
  return put('games', game);
}

export function deleteGame(id) {
  return remove('games', id);
}

// Spellen van voor de varianten bestonden hebben geen mode: dat was standaard.
export function gameMode(game) {
  return game.mode ?? 'standard';
}

export async function startGame(players, mode = 'standard') {
  const game = {
    id: newId(),
    mode,
    status: 'active',
    startedAt: new Date().toISOString(),
    finishedAt: null,
    players: players.map(({ id, name }) => ({ id, name })),
    events: [],
    winnerId: null,
  };
  await put('games', game);
  return game;
}
