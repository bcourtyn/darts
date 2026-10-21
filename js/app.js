import { route, startRouter } from './router.js';
import { requestPersistentStorage } from './db.js';
import { initTheme } from './themes.js';
import { registerServiceWorker } from './update.js';
import { homeView } from './views/home.js';
import { playersView } from './views/players.js';
import { newGameView } from './views/newgame.js';
import { gameView } from './views/game.js';
import { historyView } from './views/history.js';
import { statsView } from './views/stats.js';
import { settingsView } from './views/settings.js';

route('/', homeView);
route('/players', playersView);
route('/new', newGameView);
route('/game', gameView);
route('/history', historyView);
route('/stats', statsView);
route('/settings', settingsView);

initTheme();
startRouter();
requestPersistentStorage();
registerServiceWorker();

