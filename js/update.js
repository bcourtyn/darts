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

  const offer = (worker) => {
    // Zonder huidige versie (eerste installatie) is er niets te vernieuwen.
    if (!navigator.serviceWorker.controller) return;
    showUpdateBanner(() => {
      updateRequested = true;
      worker.postMessage({ type: 'SKIP_WAITING' });
    });
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

export function showUpdateBanner(onRefresh) {
  if (document.querySelector('.update-banner')) return;
  const banner = document.createElement('div');
  banner.className = 'update-banner';
  banner.setAttribute('role', 'status');
  banner.innerHTML = `
    <span>Nieuwe versie beschikbaar</span>
    <button class="primary">Vernieuwen</button>`;
  banner.querySelector('button').addEventListener('click', (e) => {
    e.target.disabled = true;
    e.target.textContent = 'Even geduld…';
    onRefresh();
  });
  document.body.append(banner);
}
