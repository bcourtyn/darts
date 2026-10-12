// Thema's: de stijl zelf staat in css/themes.css, hier enkel de keuze en wat het scherm moet weten.
import { loadPref, savePref } from './util.js';

// center: bij 2 spelers staan de nummers in het midden (speler links en rechts).
export const THEMES = [
  { id: 'standaard', name: 'Standaard', themeColor: '#14532d', center: false },
  { id: 'dartbord', name: 'Dartbord klassiek', themeColor: '#000000', center: true },
  { id: 'krijtbord', name: 'Krijtbord', themeColor: '#243a2d', center: true },
  { id: 'sporttv', name: 'Sport-tv', themeColor: '#ffd400', center: true },
  { id: 'licht', name: 'Licht en speels', themeColor: '#ffffff', center: false },
  { id: 'arcade', name: 'Retro arcade', themeColor: '#000000', center: false },
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
