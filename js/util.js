export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

export function formatDate(iso) {
  return new Date(iso).toLocaleString('nl-BE', { dateStyle: 'medium', timeStyle: 'short' });
}

// localStorage enkel voor kleine gemakken per toestel; mag altijd falen.
export function loadPref(key, fallback) {
  try {
    const raw = localStorage.getItem(`darts.${key}`);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function savePref(key, value) {
  try {
    localStorage.setItem(`darts.${key}`, JSON.stringify(value));
  } catch {
    // negeren
  }
}
