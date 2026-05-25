# Matomo Analytics Frontend

Eigenes Web-Frontend für Matomo Analytics. Sauber, fokussiert, mandantenfähig.

## Was das Projekt macht

Dieses Dashboard verbindet sich mit einer bestehenden Matomo-Instanz und zeigt die wichtigsten Kennzahlen in einer klaren, modernen Oberfläche:

- **KPI-Karten:** Besuche, Seitenaufrufe, Bounce Rate, Ø Verweildauer
- **Besuchertrend:** Tägliches Liniendiagramm
- **Top-Seiten:** Meistbesuchte Seiten mit Aufrufzahlen
- **Zeitraum-Auswahl:** Heute / 7 Tage / 30 Tage / 90 Tage
- **Caching:** Matomo-Daten werden 10 Minuten lang zwischengespeichert

## Voraussetzungen

- **Node.js 20 LTS** (https://nodejs.org)
- Matomo-Instanz mit aktivierter Reporting-API
- Matomo API-Token (Matomo → Profil → Sicherheit → Auth-Token)

## Setup

### 1. Abhängigkeiten installieren
```bash
npm install
```

### 2. Umgebungsvariablen setzen
```bash
copy .env.example .env.local
```

`.env.local` ausfüllen:

| Variable | Beschreibung |
|---|---|
| `MATOMO_BASE_URL` | URL der Matomo-Instanz (z.B. `https://analytics.meine-domain.de`) |
| `MATOMO_API_TOKEN` | API-Token aus Matomo → Profil → Sicherheit |
| `DEFAULT_MATOMO_SITE_ID` | Site-ID in Matomo (meist `1`) |
| `ADMIN_PASSWORD` | Frei wählbares Login-Passwort für das Dashboard |
| `NEXTAUTH_SECRET` | Beliebiger langer zufälliger Text (mind. 20 Zeichen) |
| `NEXTAUTH_URL` | `http://localhost:3000` (für lokale Entwicklung) |

### 3. Datenbank initialisieren
```bash
npm run db:migrate
```

### 4. Entwicklungsserver starten
```bash
npm run dev
```

Öffne http://localhost:3000

## Projektstruktur

```
app/
  (auth)/dashboard/     # Haupt-Dashboard mit KPIs, Trend, Top-Seiten
  (auth)/settings/      # Einstellungen (M4)
  api/auth/             # NextAuth Login-Endpunkt
  api/dashboard/        # REST-API für Dashboard-Daten
  login/                # Login-Seite
components/
  charts/               # Tremor-Diagramme (VisitorTrendChart)
  dashboard/            # Dashboard-Komponenten (Header, KpiCard, ...)
  ui/                   # shadcn/ui Basis-Komponenten
lib/
  matomo/               # Matomo API-Client (server-only!)
    client.ts           # HTTP-Wrapper mit Fehlerbehandlung
    cache.ts            # SQLite-Cache (TTL 10 Min.)
    transforms.ts       # Matomo-Rohdaten → eigene Datenmodelle
  db/                   # Drizzle ORM + SQLite
  auth/                 # Auth-Helper (requireUser, assertSiteAccess)
types/                  # Geteilte TypeScript-Typen
```

## Meilensteine

| # | Inhalt | Status |
|---|---|---|
| M1 | Setup, Login (NextAuth), DB-Schema | ✅ Fertig |
| M2 | Matomo-Client, Cache, API-Route | ✅ Fertig |
| M3 | Dashboard-UI: KPIs, Trend, Top-Seiten, Zeitraum-Auswahl | ✅ Fertig |
| M4 | Multi-Tenancy: mehrere Nutzer, Site-Verwaltung | 🔜 Geplant |
| M5 | Weitere KPIs, PDF-Export, Produktiv-Deployment | 🔜 Geplant |

## Wichtige Regeln

- **Matomo-Token NIE im Client-Code** – nur in API-Routes / Server Components
- **`.env.local` niemals committen** – steht in `.gitignore`
- **Nach jedem Meilenstein git commit** – so kann man jederzeit zurück
