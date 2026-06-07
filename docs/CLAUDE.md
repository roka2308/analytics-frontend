# Analytics Dashboard – Projekt-Leitplanken

> Diese Datei ist der verbindliche Architektur-Rahmen. Vor größeren
> Änderungen lesen und einhalten. Kurz halten – Details liegen in `docs/`.

## Was dieses Projekt ist

Ein Analytics-Dashboard, das Daten aus **mehreren Quellen** vereint:
- **Matomo** (Web-Analytics) – bereits angebunden
- **SQL-Datenbank** (E-Commerce) – wird migriert (Stand: HTML-Dashboard einer Kollegin)

Weitere Quellen sollen später ohne Architektur-Umbau ergänzbar sein.

## Stack

- Next.js, TypeScript
- shadcn/ui + Tremor (UI / Charts)
- DataSources serverseitig (Route Handlers / Server Components)

## Kern-Architektur (drei Schichten)

```
UI-Komponenten (shadcn/Tremor)
        ↓   redet NUR mit der Registry
Aggregations-/Registry-Schicht  (DataRegistry)
        ↓   einheitliches DataSource-Interface
DataSources:  MatomoDataSource   |   SqlDataSource
        ↓
Matomo-API        SQL-DB (nur serverseitig)
```

**Verbindliche Regeln:**

1. **Das `DataSource`-Interface ist der Vertrag.** Jede Quelle implementiert
   `listMetrics()` und `fetch(metricId, query)`. Siehe `lib/data/datasource.ts`.

2. **Alles wird normalisiert** in eine von drei Formen: `scalar`, `timeseries`,
   `table`. Daten aus verschiedenen Quellen MÜSSEN dasselbe Format haben –
   nur so lassen sie sich in einem Chart mischen. Datum immer ISO (`YYYY-MM-DD`).

3. **UI kennt die Quelle nicht.** Komponenten holen Daten ausschließlich über
   die `DataRegistry`, nie direkt aus Matomo oder SQL.

4. **SQL läuft ausschließlich serverseitig.** DB-Credentials und Queries dürfen
   nie ins Client-Bundle. Zugriff nur über Route Handler / Server Components.

5. **Gemeinsames `Query`-Objekt** (`from`, `to`, `granularity`, `filters`) geht
   an alle Quellen. Erzwingt gleiche Zeitachse → Voraussetzung fürs Kombinieren.
   Eine Quelle ignoriert Filter, die sie nicht kennt.

## Views / Charts

- **Getrennte Views**: eine Quelle → `registry.fetchFrom(...)`
- **Kombinierte Views**: mehrere Quellen in einem Chart →
  `registry.fetchCombinedTimeSeries(...)`, gleiche Query an alle.

## Migrationsreihenfolge (in dieser Reihenfolge!)

1. ⬜ Bestehende Matomo-Logik hinter das `DataSource`-Interface bringen
   (`MatomoDataSource`). UI vorerst NICHT anfassen.
2. ⬜ `SqlDataSource` an die 5 vorberechneten MySQL-Views anbinden
   (Details: `docs/sql-views.md`). Serverseitig.
3. ⬜ Getrennte SQL-Views im Dashboard darstellen (validiert das Format).
4. ⬜ Erste kombinierte View (Matomo + SQL in einem Chart).
5. ⬜ Corporate-Design-Tokens aus dem Firmen-Repo als zentrale
   Token-Schicht (CSS-Variablen + Tailwind-Config) einbinden.

In **kleinen, abgeschlossenen Schritten** arbeiten und nach jedem committen.
Nicht „alles auf einmal" migrieren.

## Wichtige Dateien

- `lib/data/datasource.ts` – Interface, Formate, Registry (der Vertrag)
- `lib/data/sql-datasource.ts` – SQL-Anbindung (Startgerüst)
- `docs/sql-views.md` – Katalog der 5 SQL-Views (Felder, Granularität)

## Entwicklungs-Leitlinien (verbindlich für jede KI-Arbeit)

Diese Prinzipien gelten projektweit – auch wenn der Prompt sie nicht wiederholt:

1. **Think Big.** Über den Prompt hinausdenken und nach eigenem Wissen + Best
   Practice sinnvoll erweitern. Der Auftraggeber gibt bewusst nicht jedes Detail
   vor; fehlende Aspekte eigenständig, sauber und zukunftssicher ergänzen.
2. **Mobile is the Future.** Jede Ansicht/Komponente muss auf Mobilgeräten
   funktionieren und gut aussehen (responsive, Touch-tauglich). Mobile beim Bauen
   sofort mitdenken, nicht nachträglich.
3. **Innovation is king.** Ziel ist ein Produkt, das besser ist als die Konkurrenz.
   Innovative, durchdachte Lösungen bevorzugen statt Minimal-Umsetzung.
4. **No idea is wrong.** Proaktiv Ideen und Features vorschlagen; Vorschläge sind
   ausdrücklich erwünscht.

Querschnitt bleibt: Sicherheit immer mitdenken; in kleinen, gebauten (Build grün)
und committeten Schritten arbeiten; Code übergabefähig dokumentieren.
