// Eenvoudige hash-router: #/pad?x=y → view-functie die in het #app-element rendert.

const routes = new Map();

export function route(path, view) {
  routes.set(path, view);
}

export function navigate(path) {
  location.hash = `#${path}`;
}

async function render() {
  const [path, query = ''] = location.hash.slice(1).split('?');
  const view = routes.get(path || '/') ?? routes.get('/');
  const root = document.getElementById('app');
  document.body.dataset.view = path.replace(/^\//, '') || 'home';
  root.replaceChildren();
  await view(root, new URLSearchParams(query));
  window.scrollTo(0, 0);
}

export function startRouter() {
  window.addEventListener('hashchange', render);
  render();
}
