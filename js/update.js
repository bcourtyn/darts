// Service worker registreren en een melding tonen zodra er een nieuwe versie klaarstaat.

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  let reg;
  try {
    reg = await navigator.serviceWorker.register('./sw.js');
  } catch (err) {
    console.warn('Service worker niet geregistreerd', err);
    return;
  }

  // Enkel herladen als de gebruiker zelf op "Vernieuwen" tikte (niet bij de allereerste installatie).
  let updateRequested = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (updateRequested) location.reload();
  });

  const offer = async (worker) => {
    // Zonder huidige versie (eerste installatie) is er niets te vernieuwen.
    if (!navigator.serviceWorker.controller) return;
    const version = await askVersion(worker);
    showUpdateBanner(() => {
      updateRequested = true;
      worker.postMessage({ type: 'SKIP_WAITING' });
    }, version);
  };

  if (reg.waiting) offer(reg.waiting);
  reg.addEventListener('updatefound', () => {
    const worker = reg.installing;
    worker?.addEventListener('statechange', () => {
      if (worker.state === 'installed') offer(worker);
    });
  });

  // Op iPad blijft de app in het geheugen: bij terugkeren opnieuw naar een nieuwe versie kijken.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') reg.update().catch(() => {});
  });
}

// Het versienummer staat in sw.js (VERSION) en wordt aan de service worker zelf gevraagd.
export function askVersion(worker, timeout = 1000) {
  if (!worker) return Promise.resolve(null);
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => resolve(null), timeout);
    channel.port1.onmessage = (e) => {
      clearTimeout(timer);
      resolve(e.data);
    };
    worker.postMessage({ type: 'GET_VERSION' }, [channel.port2]);
  });
}

// Versie die nu actief is op dit toestel; null zonder service worker (bv. lokaal testen).
export async function currentVersion() {
  const version = await askVersion(navigator.serviceWorker?.controller);
  if (version != null) return version;
  // Oudere service workers kennen GET_VERSION nog niet: afleiden uit de naam van de cache.
  const keys = (await globalThis.caches?.keys()) ?? [];
  const numbers = keys.map((k) => Number(k.match(/^darts-v(\d+)$/)?.[1])).filter(Boolean);
  // Staat er een update klaar, dan bestaan er twee caches; de actieve versie is de oudste.
  return numbers.length ? Math.min(...numbers) : null;
}

export function showUpdateBanner(onRefresh, version = null) {
  if (document.querySelector('.update-banner')) return;
  const banner = document.createElement('div');
  banner.className = 'update-banner';
  banner.setAttribute('role', 'status');
  banner.innerHTML = `
    <span>${version != null ? `Versie ${version} beschikbaar` : 'Nieuwe versie beschikbaar'}</span>
    <button class="primary">Vernieuwen</button>`;
  banner.querySelector('button').addEventListener('click', (e) => {
    e.target.disabled = true;
    e.target.textContent = 'Even geduld…';
    onRefresh();
  });
  document.body.append(banner);
}
