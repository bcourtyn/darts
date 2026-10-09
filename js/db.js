// Kleine wrapper rond IndexedDB. Alle gegevens blijven lokaal op het toestel.

const DB_NAME = 'darts';
const DB_VERSION = 1;
export const STORES = ['players', 'games'];

let dbPromise;

function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('players')) {
          db.createObjectStore('players', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('games')) {
          const games = db.createObjectStore('games', { keyPath: 'id' });
          games.createIndex('startedAt', 'startedAt');
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

function promisify(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function store(name, mode = 'readonly') {
  const db = await openDb();
  return db.transaction(name, mode).objectStore(name);
}

export async function getAll(name) {
  return promisify((await store(name)).getAll());
}

export async function get(name, id) {
  return promisify((await store(name)).get(id));
}

export async function put(name, value) {
  return promisify((await store(name, 'readwrite')).put(value));
}

export async function remove(name, id) {
  return promisify((await store(name, 'readwrite')).delete(id));
}

export function newId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function exportAll() {
  const data = { app: 'darts', version: DB_VERSION, exportedAt: new Date().toISOString() };
  for (const name of STORES) data[name] = await getAll(name);
  return data;
}

// Voegt geïmporteerde records toe of overschrijft ze op basis van id (merge, geen wis).
export async function importAll(data) {
  if (data?.app !== 'darts') throw new Error('Dit is geen geldig darts-exportbestand.');
  const db = await openDb();
  const tx = db.transaction(STORES, 'readwrite');
  for (const name of STORES) {
    for (const record of data[name] ?? []) tx.objectStore(name).put(record);
  }
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Vraag de browser om de opslag niet automatisch te wissen (belangrijk op iPad).
export async function requestPersistentStorage() {
  if (!navigator.storage?.persist) return false;
  if (await navigator.storage.persisted()) return true;
  return navigator.storage.persist();
}
