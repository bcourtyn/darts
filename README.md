# Darts Cricket

Scorebord voor darts cricket als Progressive Web App (PWA). Werkt offline op iPad, Windows en Android, zonder app store.

## Lokaal testen

```
powershell -ExecutionPolicy Bypass -File serve.ps1
```

Open daarna http://localhost:8080.

## Installeren op een toestel

De app moet via HTTPS gehost worden (bv. GitHub Pages of Cloudflare Pages). Daarna:

- **iPad**: open in Safari → Deel → *Zet op beginscherm*. Gebruik de app altijd via het beginscherm, anders kan Safari de gegevens wissen.
- **Windows**: open in Edge/Chrome → *App installeren* in de adresbalk.
- **Android**: open in Chrome → menu → *App installeren*.

## Structuur

| Pad | Inhoud |
|---|---|
| `index.html` | App-shell |
| `manifest.json` | PWA-manifest (naam, iconen, weergave) |
| `sw.js` | Service worker voor offline gebruik |
| `css/app.css` | Opmaak |
| `js/app.js` | Opstart, routes, service worker-registratie |
| `js/router.js` | Hash-router |
| `js/db.js` | IndexedDB-opslag, export/import |
| `js/views/` | Schermen |
| `serve.ps1` | Lokale testserver (enkel PowerShell) |

## Nieuwe versie uitrollen

De app wordt gehost via GitHub Pages (branch `main`, map `/ (root)`).

1. Verhoog `CACHE_VERSION` in `sw.js` en voeg nieuwe bestanden toe aan de `ASSETS`-lijst.
2. Commit en push naar `main`. GitHub Pages publiceert automatisch binnen een minuut.
3. Geïnstalleerde toestellen halen de nieuwe versie op bij de volgende keer openen (soms pas bij de tweede keer).
