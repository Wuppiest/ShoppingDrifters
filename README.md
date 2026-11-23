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
| Leertaste | Räder gerade + Heck reinziehen + mäßig bremsen – rettet dich aus einem Drift |
| | Der Wagen driftet von selbst – lange driften und dann geradeziehen = **Turbo** |
| E | Produkt einladen (vor dem Regal abbremsen!) |
| Maus / Finger ziehen | Umschauen |
| Esc / P | Pause |

## Regeln
- Oben links läuft die Uhr, oben rechts steht die Einkaufsliste.
- Fährst du zu lange zu langsam, startet ein Countdown – läuft er ab, ist die Runde vorbei. Die Mindestgeschwindigkeit ist auf dem Tacho rot markiert. Direkt vor einem gesuchten Produkt darfst du anhalten.
- Gesuchte Produkte werden aus der Nähe gelb markiert – die Gang-Schilder verraten, wo was steht.
- Ist alles eingeladen, ab in eine der Kassen (die Lampen werden grün).
- Jedes Level wird schwerer: längere Liste, höheres Mindesttempo, und nach und nach Wasserpfützen (ab Level 2), andere Einkäufer (ab Level 3) und umkippende Kartonstapel (ab Level 4).

Bestzeiten und Einstellungen werden lokal im Browser gespeichert.

## Entwicklung
Der Quellcode liegt in `src/`, Three.js (r159, MIT) in `vendor/`. Nach Änderungen die Datei neu bauen:

```bash
node build.js
```
