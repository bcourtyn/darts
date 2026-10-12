// Thema's: de stijl zelf staat in css/themes.css, hier enkel de keuze en wat het scherm moet weten.
import { loadPref, savePref } from './util.js';

// center: bij 2 spelers staan de nummers in het midden (speler links en rechts).
// swatch: kleuren voor het voorbeeldje in de themakiezer [achtergrond, speler 1, nummers, speler 2].
export const THEMES = [
  { id: 'standaard', name: 'Standaard', themeColor: '#14532d', center: false, swatch: ['#0f172a', '#1e293b', '#0f172a', '#1e293b'] },
  { id: 'dartbord', name: 'Dartbord klassiek', themeColor: '#000000', center: true, swatch: ['#0d0d0d', '#b3202a', '#f3e9d2', '#1f7a45'] },
  { id: 'krijtbord', name: 'Krijtbord', themeColor: '#243a2d', center: true, swatch: ['#2b4434', '#3f604b', '#f7d774', '#3f604b'] },
  { id: 'sporttv', name: 'Sport-tv', themeColor: '#ffd400', center: true, swatch: ['#0b1430', '#00a3ff', '#ffd400', '#e0115f'] },
  { id: 'licht', name: 'Licht en speels', themeColor: '#ffffff', center: false, swatch: ['#f6f4ef', '#cfe8ff', '#f6f4ef', '#ffd9c7'] },
  { id: 'arcade', name: 'Retro arcade', themeColor: '#000000', center: false, swatch: ['#000000', '#39ff14', '#ffe600', '#ff2bd6'] },
];

export function currentTheme() {
  return THEMES.find((t) => t.id === document.documentElement.dataset.theme) ?? THEMES[0];
}

export function applyTheme(id) {
  const theme = THEMES.find((t) => t.id === id) ?? THEMES[0];
  document.documentElement.dataset.theme = theme.id;
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', theme.themeColor);
  savePref('theme', theme.id);
  return theme;
}

export function initTheme() {
  return applyTheme(loadPref('theme', THEMES[0].id));
}
