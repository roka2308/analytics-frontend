# Marken-Schrift TeleNeoWeb

Die Telekom-Hausschrift **TeleNeoWeb** ist proprietär und darf nicht im
öffentlichen Repository liegen. Lege die Web-Font-Dateien hier ab, dann
aktivieren sich die `@font-face`-Regeln in `app/globals.css` automatisch.

## Benötigte Dateien

| Datei | Gewicht |
|---|---|
| `TeleNeoWeb-Regular.woff2` | 400 (Regular) |
| `TeleNeoWeb-Medium.woff2` | 500 (Medium) |
| `TeleNeoWeb-Bold.woff2` | 700 (Bold) |
| `TeleNeoWeb-ExtraBold.woff2` | 800 (ExtraBold) |

## Bezugsquelle

Die Dateien erhältst du über das Telekom Brand- bzw. Designsystem-Portal
(Scale). Falls nur `.woff`/`.ttf` vorliegen, in `.woff2` konvertieren
(z. B. via `woff2_compress` oder fonttools) für optimale Performance.

## Hinweis

Bis die Dateien vorhanden sind, nutzt die App **Inter** als Fallback –
ohne Konsolen-Fehler. Die `@font-face`-`src`-URLs zeigen auf
`/fonts/TeleNeoWeb-*.woff2`; ein fehlendes File überspringt der Browser
einfach.

> Diese Font-Dateien sollten in `.gitignore` stehen (proprietär).
