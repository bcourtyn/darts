import { route, startRouter } from './router.js';
import { requestPersistentStorage } from './db.js';
import { homeView } from './views/home.js';
import { playersView } from './views/players.js';
import { newGameView } from './views/newgame.js';
import { gameView } from './views/game.js';
import { historyView } from './views/history.js';
import { settingsView } from './views/settings.js';

route('/', homeView);
route('/players', playersView);
route('/new', newGameView);
route('/game', gameView);
route('/history', historyView);
route('/settings', settingsView);

startRouter();
requestPersistentStorage();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch((err) => console.warn('Service worker niet geregistreerd', err));
}
