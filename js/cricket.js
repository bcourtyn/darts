// Spellogica voor cricket. Zuiver: geen DOM, geen opslag.
//
// Een spel is een lijst van events { p: playerId, t: target }: elk event is één mark.
// Single = 1 klik, double = 2 klikken, triple = 3 klikken. Er wordt geen beurt bijgehouden.
//
// Varianten (een mark boven de 3 op een nummer dat nog niet bij iedereen gesloten is):
// - standard:  de speler krijgt de waarde van het nummer bij.
// - cutthroat: zolang de speler de enige is die het nummer sloot, krijgt hij de waarde bij (zoals standard).
//              Hebben ook andere spelers het gesloten, dan krijgt elke tegenstander die het nog open heeft
//              de waarde afgetrokken. Met 2 spelers komt dit dus neer op standard.
// In beide varianten wint wie alles gesloten heeft en minstens evenveel punten heeft als elke tegenstander.

export const BULL = 25;
export const TARGETS = [20, 19, 18, 17, 16, 15, BULL];

export const MODES = {
  standard: 'Standaard',
  cutthroat: 'Cut-throat',
};

// Standaard bij meer dan 2 spelers: cut-throat.
export function defaultMode(playerCount) {
  return playerCount > 2 ? 'cutthroat' : 'standard';
}

export function targetLabel(t) {
  return t === BULL ? 'Bull' : String(t);
}

export function computeState(playerIds, events, mode = 'standard') {
  const marks = Object.fromEntries(playerIds.map((id) => [id, Object.fromEntries(TARGETS.map((t) => [t, 0]))]));
  const points = Object.fromEntries(playerIds.map((id) => [id, 0]));
  const state = { playerIds, mode, marks, points, winnerId: null };

  for (const { p, t } of events) {
    if (state.winnerId) break;
    if (!marks[p] || !(t in marks[p])) continue;
    if (marks[p][t] < 3) {
      marks[p][t]++;
    } else {
      const open = openOpponents(state, p, t);
      const soleCloser = open.length === playerIds.length - 1;
      if (mode === 'cutthroat' && !soleCloser) {
        for (const id of open) points[id] -= t;
      } else if (open.length > 0) {
        points[p] += t;
      }
    }
    // Bij cut-throat kan ook een tegenstander winnen door deze worp; de werper gaat voor.
    state.winnerId = [p, ...playerIds.filter((id) => id !== p)].find((id) => hasWon(state, id)) ?? null;
  }
  return state;
}

function openOpponents(state, playerId, target) {
  return state.playerIds.filter((id) => id !== playerId && state.marks[id][target] < 3);
}

function hasWon(state, playerId) {
  const allClosed = TARGETS.every((t) => state.marks[playerId][t] >= 3);
  return allClosed && state.playerIds.every((id) => state.points[playerId] >= state.points[id]);
}

export function isClosedByAll(state, target) {
  return state.playerIds.every((id) => state.marks[id][target] >= 3);
}

// Een klik telt enkel als hij nog iets verandert (mark bijzetten of punten scoren/aftrekken).
export function canMark(state, playerId, target) {
  if (state.winnerId) return false;
  return state.marks[playerId][target] < 3 || openOpponents(state, playerId, target).length > 0;
}
