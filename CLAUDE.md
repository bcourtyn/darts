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
- Standaardvariant bij nieuw spel: cut-throat bij > 2 spelers, anders standaard; een manuele keuze blijft staan.
- 1 tot 4 spelers per spel, gekozen uit een vaste spelerslijst. Spelers kunnen op "doet niet mee" gezet worden (`active: false`) i.p.v. verwijderd; enkel actieve spelers verschijnen bij een nieuw spel (bij ≤ 4 allemaal aangevinkt). Spellen bewaren een kopie van de spelersnamen.
- Klassement (gespeeld, gewonnen, winst %) telt enkel afgewerkte spellen met ≥ 2 spelers. Gestopte spellen worden niet bewaard.

## Werkwijze
- Bij elke wijziging aan bestanden: verhoog `CACHE_VERSION` in `sw.js` en houd de `ASSETS`-lijst up-to-date.
- Lokaal testen met `serve.ps1` (http://localhost:8080).
