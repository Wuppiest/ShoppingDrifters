# Shopping Drifters 🛒💨

3D-Driftspiel im Low-Poly-Stil, als **eine einzige HTML-Datei**: `index.html` im Browser öffnen, fertig (läuft offline, einfach verschicken).

Du stehst hinten auf einem getunten Einkaufswagen (mit Motor, Auspuff-Flammen, Spoiler, Neon und Tacho) und driftest durch den Drift-Markt.
Arbeite die Einkaufsliste so schnell wie möglich ab und drifte danach zur Kasse.

## Steuerung
| Taste | Aktion |
|---|---|
| W | Gas |
| S | Bremsen / Rückwärts |
| A / D | Lenken |
| Leertaste | **Hockey-Stopp** – Räder blockieren: der Wagen rutscht quer weiter, bremst hart und kippt auf zwei Räder; mit A/D dabei die Front weiterdrehen |
| Shift | **Nitro zünden** – lange driften und geradeziehen füllt die Nitro-Flasche am Lenker, dann hast du 3 Sekunden |
| E (halten) | Produkt einladen – geht auch im Vorbeirollen bis 15 km/h; schneller = es fällt runter |
| Maus / Finger ziehen | Umschauen |
| Esc / P | Pause |

### iPad / Touch
Wird automatisch erkannt (am besten im Querformat). Sobald die Tastatur benutzt wird, verschwinden die Knöpfe – beim nächsten Antippen sind sie wieder da.

| Touch | Aktion |
|---|---|
| Linke Bildschirmhälfte | Daumen hinlegen und zur Seite ziehen = Lenken (analog) |
| GAS / BREMSE | Gas geben / bremsen & rückwärts |
| STOPP | Hockey-Stopp (wie Leertaste) |
| GREIFEN (halten) | Produkt einladen (leuchtet gelb, wenn ein gesuchtes Produkt in Reichweite ist) |
| NITRO | Erscheint, wenn die Flasche voll ist – antippen zum Zünden |
| Rechts wischen | Umschauen |
| ❚❚ oben links | Pause |

## Regeln
- Oben links läuft die Uhr, oben rechts steht die Einkaufsliste.
- Fährst du zu lange zu langsam, startet ein Countdown – läuft er ab, ist die Runde vorbei. Die Mindestgeschwindigkeit ist auf dem Tacho rot markiert. Direkt vor einem gesuchten Produkt darfst du anhalten.
- Schräg an Regalen entlangschrammen (Wall-Ride) kostet kaum Tempo und sprüht Funken – frontal reinkrachen bremst hart.
- Gesuchte Produkte werden aus der Nähe gelb markiert – die Gang-Schilder verraten, wo was steht.
- Ist alles eingeladen, ab in eine der Kassen (die Lampen werden grün).
- Jedes Level wird schwerer: längere Liste, höheres Mindesttempo, und nach und nach Wasserpfützen (ab Level 2), andere Einkäufer (ab Level 3) und umkippende Kartonstapel (ab Level 4).

Bestzeiten und Einstellungen werden lokal im Browser gespeichert.

## Entwicklung
Der Quellcode liegt in `src/`, Three.js (r159, MIT) in `vendor/`. Nach Änderungen die Datei neu bauen:

```bash
node build.js
```
