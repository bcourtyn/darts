# Darts Cricket

Persoonlijk project, volledig los van alle andere projecten (o.a. Counterfort). Neem geen code, conventies of afhankelijkheden over uit andere projecten.

## Uitgangspunten
- PWA in vanilla HTML/CSS/JavaScript (ES modules). Geen framework, geen npm, geen build-stap, geen externe bibliotheken.
- Moet draaien op iPad (Safari), Windows en Android; volledig offline na eerste laadbeurt.
- Opslag lokaal in IndexedDB (`js/db.js`). Synchronisatie tussen toestellen via JSON export/import; automatische sync is optioneel voor later.
- UI in het Nederlands, touch-vriendelijk (knoppen min. 48px).

## Spelregels
- Nummers 20–15 en Bull (25). Logica zit puur in `js/cricket.js`; een spel is een lijst events `{ p, t }`, één event = één mark.
- Invoer zo simpel mogelijk: single = 1 klik, double = 2, triple = 3. Geen beurtbeheer; de speler is zelf verantwoordelijk. Ongedaan maken = laatste event weghalen.
- Varianten (`game.mode`, ontbreekt bij oude spellen = standard). Een mark boven 3 op een nummer dat nog niet bij iedereen dicht is:
  - `standard`: waarde bij voor de speler zelf.
  - `cutthroat`: zolang je de enige bent die het nummer sloot, waarde bij voor jezelf (zoals standard). Zodra minstens één andere speler het ook sloot, waarde **afgetrokken** bij elke tegenstander die het nog open heeft. Eigen keuze van de gebruiker: ook hier speel je naar de meeste punten, niet de minste. Met 2 spelers = standard.
- Winst (beide varianten): alles gesloten én punten ≥ elke tegenstander. Bij cut-throat kan iemand winnen door de worp van een ander.
- Standaardvariant bij nieuw spel: altijd cut-throat (`DEFAULT_MODE`); met 1–2 spelers is het resultaat toch gelijk aan standaard.
- 1 tot 4 spelers per spel, gekozen uit een vaste spelerslijst. Spelers kunnen op "doet niet mee" gezet worden (`active: false`) i.p.v. verwijderd; enkel actieve spelers verschijnen bij een nieuw spel (bij ≤ 4 allemaal aangevinkt). Spellen bewaren een kopie van de spelersnamen.
- Klassement (gespeeld, gewonnen, winst %) telt enkel afgewerkte spellen met ≥ 2 spelers. Gestopte spellen worden niet bewaard.
- Statistieken (`js/stats.js`, scherm `#/stats`) worden telkens herberekend uit de events; er wordt niets apart opgeslagen. `computeState` levert daarvoor ook `hits`, `firstClosed`, `gained` en `dealt`. Marks/nummers tellen alle afgewerkte spellen (ook solo); winst, reeksen en duels enkel ≥ 2 spelers. Geen MPR: er worden geen beurten bijgehouden.

## Thema's
- Keuze per toestel (localStorage `darts.theme`), gezet als `<html data-theme>`; een inline script in `index.html` zet het al vóór de eerste weergave.
- `css/app.css` gebruikt enkel variabelen (`--bg`, `--accent`, `--on-accent`, `--cell-bg`, `--mark`, `--font-display`, …); `css/themes.css` overschrijft ze per thema. Nieuwe opmaak: geen vaste kleuren, altijd een variabele.
- `js/themes.js` bevat de lijst (naam, `center`). `center: true` = bij 2 spelers staan de nummers in het midden.
- De themakiezer in Instellingen toont per thema het echte scorebord (Matthias tegen Bert, Bert voor) in een `srcdoc`-iframe, zodat het thema niet uitlekt naar de pagina. Het bord komt uit `boardHtml()` in `js/views/game.js`.
- Spelerskleuren via klassen `p0`–`p3` (variabelen `--pc`, `--pc-bg`, `--pc-fg`).
- Lettertypes lokaal in `fonts/` (offline); ontbreken ze, dan vallen de thema's terug op systeemletters.

## Werkwijze
- Bij elke wijziging aan bestanden: verhoog `CACHE_VERSION` in `sw.js` en houd de `ASSETS`-lijst up-to-date.
- Updates: een nieuwe service worker wacht (geen automatische `skipWaiting`); `js/update.js` toont dan "Nieuwe versie beschikbaar" en activeert pas na een tik op Vernieuwen, waarna de pagina herlaadt. Bij terugkeren naar de app (visibilitychange) wordt opnieuw naar updates gekeken.
- Lokaal testen met `serve.ps1` (http://localhost:8080).
- Git: committen mag, **nooit pushen** — de gebruiker pusht altijd zelf (push naar `main` = live via GitHub Pages). Commits gebruiken de repo-lokale privé-identiteit, nooit de werkidentiteit.
