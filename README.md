# Matomo Analytics Frontend

Mandantenfähiges White-Label-Frontend für Matomo Analytics. Sauber, fokussiert,
mehrstufig (Kunde → Projekt → Datenquelle → Dashboard).

> **Für Einarbeitung/Übergabe:** zuerst [`docs/HANDOVER.md`](docs/HANDOVER.md)
> (Sektion 0 = aktueller Stand) und [`docs/ROADMAP.md`](docs/ROADMAP.md) lesen.
> Architektur-Leitplanken: [`docs/CLAUDE.md`](docs/CLAUDE.md).

## Was das Projekt macht

Verbindet sich mit einer bestehenden Matomo-Instanz, bereitet die Daten serverseitig
auf (Token bleibt am Server, Caching) und zeigt kuratierte Dashboards in einer
modernen, deutschsprachigen Oberfläche:

- **Hierarchie:** Kunden → Projekte → Datenquellen (Matomo/SQL) → Dashboards
- **Widgets (9 Typen):** Hero-Metrik, KPI-Karte, Liniendiagramm, Top-Liste,
  Text-Block, Breakdown-Tabelle, Donut, Balken, **Report-Explorer** (jeder
  Matomo-Report, frei kombinier-/pivotierbar – 8 Darstellungen inkl. Pivot/
  gruppierte Tabelle)
- **In-Place-Editor:** Drag-&-Drop-Raster (react-grid-layout), Widget-Palette,
  Konfiguration pro Widget; Dashboard-Vorlagen (Branchen-Templates + gespeicherte
  Bibliothek unter `/templates`)
- **Zeitraum & Vergleich:** Heute / 7 / 30 / 90 Tage, eigener Zeitraum,
  Vorperiode-/Vorjahr-Vergleich; Default-Zeitraum pro Dashboard
- **Teilen ohne Login:** widerrufbare Token-Links (`/share/[token]`)
- **Branding:** Kunde-Default + Projekt-Override (Logo + Akzentfarbe), schlägt bis
  in die Chart-Farben durch
- **Rechte:** Rollen admin / creator / viewer + datengetriebene `access_grants`
  (Scope Kunde/Projekt/Dashboard); zentrale Policy in `lib/auth/permissions.ts`
- **Verwaltung:** Kunden (`/kunden`), Zugriffsrechte (`/zugriffe`), Audit-Log
  (`/protokoll`), Papierkorb mit Soft-Delete (`/papierkorb`), Einladungen per Link
- **Caching:** Matomo-Daten 10 Min. (SQLite); manuelles Cache-Vorwärmen
- **Light/Dark**, Mobile-Drawer, Telekom-Scale-Design (Magenta + blauer Fokus)

## Stack

Next.js 14 (App Router, TypeScript) · Tailwind · shadcn/ui-Nachbauten ·
Tremor + Recharts · NextAuth (Credentials, bcrypt) · Drizzle ORM ·
libSQL/SQLite → Turso (Produktion, EU) · react-grid-layout · next-themes.
Hosting: Vercel (EU).

## Voraussetzungen

- **Node.js 20 LTS** (https://nodejs.org)
- Matomo-Instanz mit aktivierter Reporting-API
- Matomo API-Token (Matomo → Profil → Sicherheit → Auth-Token)

## Setup (lokale Entwicklung)

```bash
npm install
copy .env.example .env.local   # dann ausfüllen (Tabelle unten)
npm run db:migrate             # lokale SQLite-Tabellen anlegen
npm run dev                    # http://localhost:3000
```

Beim ersten Aufruf führt der **`/setup`-Flow** durch das Anlegen des ersten
Admin-Kontos. Danach unter `/kunden` Kunden/Projekte/Datenquellen/Nutzer verwalten.

| Variable | Beschreibung |
|---|---|
| `DATABASE_URL` | `file:local.db` für lokale SQLite-Datei (Prod: `libsql://…` Turso) |
| `DATABASE_AUTH_TOKEN` | nur Turso (Produktion) |
| `MATOMO_BASE_URL` | URL der Matomo-Instanz |
| `MATOMO_API_TOKEN` | API-Token aus Matomo → Profil → Sicherheit |
| `DEFAULT_MATOMO_SITE_ID` | Site-ID der ersten Datenquelle (Auto-Seed beim Start) |
| `NEXTAUTH_SECRET` | langer Zufallstext (mind. 32 Zeichen) |
| `NEXTAUTH_URL` | `http://localhost:3000` (dev) bzw. Produktiv-URL |
| `CRON_SECRET` | optional, schützt `/api/cron/warm` (Cache-Vorwärmen) |

## Projektstruktur (Auszug)

```
app/
  (auth)/projekte/[orgSlug]/dashboards/[slug]/        # Dashboard-Ansicht
  (auth)/projekte/[orgSlug]/dashboards/[slug]/edit/   # In-Place-Grid-Editor
  (auth)/kunden/ (+/[customerSlug])                   # Verwaltung (Master-Detail)
  (auth)/zugriffe/ (+/[userId])                       # Zugriffsrechte
  (auth)/templates/ /protokoll/ /papierkorb/ /konto/  # Library, Audit, Trash, Konto
  share/[token]/  einladung/[token]/                  # öffentlich (kein Login)
  login/ setup/ page.tsx  globals.css                 # Auth, Landing, Theme-Tokens
  api/auth/[...nextauth]/  api/data/  api/matomo/reports/  api/cron/warm/
components/
  layout/      # AppShell, Sidebar, SidebarNav, Topbar, MasterDetailShell
  dashboard/   # DashboardRenderer/Grid, Header, DateRangePicker, ShareButton, …
  widgets/     # 9 Widget-Typen (HeroMetricWidget, KpiCardWidget, ReportWidget, …)
  charts/      # VisitorTrendChart, EvolutionChart, Sparkline, Hero/Donut/BarList
  editor/      # DashboardGridEditor, ReportWidgetConfig, DimensionMetricConfig
  settings/    # ProjectsManager, CustomerUsersManager, UserAccessDetail, …
  ui/          # shadcn-Basis: button, card, input, select, native-select, modal, …
lib/
  db/          # schema.ts, queries.ts (Drizzle, libSQL/SQLite/Turso)
  matomo/      # client.ts (server-only), cache.ts, transforms.ts, metadata.ts, crosstab.ts
  auth/        # config.ts, requireUser.ts, permissions.ts, users.ts
  actions/     # Server-Actions (customers, organizations, dataSources, users, dashboards,
               #   widgets, sections, branding, sharing, templates)
  widgets/     # registry.ts (server) · meta.ts (client) · templates.ts (Branchen-Vorlagen)
  branding.ts  metrics/registry.ts  dateRange.ts  cache/warm.ts
docs/          # HANDOVER, ROADMAP, CLAUDE, DESIGN-TOKENS, TELEKOM-INTEGRATION, sql-views
drizzle/       # Migrationen 0000–0012
```

## Rollen & Berechtigungen

- **admin:** sieht/verwaltet alles (Bypass in der Policy).
- **creator:** darf in berechtigten Projekten Dashboards/Widgets bearbeiten.
- **viewer:** sieht nur per `access_grant` freigegebene Kunden/Projekte/Dashboards.

Zentrale Policy in `lib/auth/permissions.ts` (`canViewProject`/`canEditProject`,
Scope-basierte `access_grants`). Der JWT-Callback liest Rolle/Org bei **jedem**
Request frisch aus der DB → Rollenänderungen greifen ohne Neu-Login.

## Wichtige Regeln (Konventionen)

- **`npm run build` muss grün sein** vor jedem Commit.
- **Matomo-Token NIE im Client-Code** – nur Server Components / Actions / API-Routes.
- **`.env.local` niemals committen** (steht in `.gitignore`).
- **Schema-Änderung → Migration lokal UND auf Turso** anwenden, Turso **vor** dem
  Deploy (sonst crasht Live). Details in `docs/HANDOVER.md`.
- **Widget-Registry-Split:** `lib/widgets/registry.ts` (server-only) NICHT in
  Client-Komponenten importieren – Client nutzt `lib/widgets/meta.ts`.
- **Server-Actions immer mit `requireUser`/`requireAdmin`/Policy absichern.**
- Nur Theme-Tokens nutzen (`bg-accent`, `text-foreground` …), keine Hardcoded-Farben.

## Skripte

| Befehl | Zweck |
|---|---|
| `npm run dev` | Entwicklungsserver (Port 3000) |
| `npm run build` | Produktiv-Build (Pflicht-Gate vor Commit) |
| `npm run start` | Produktiv-Server (nach `build`) |
| `npm run lint` | ESLint |
| `npm run db:generate` | Drizzle-Migration aus Schema-Änderungen erzeugen |
| `npm run db:migrate` | Migrationen auf DB anwenden |

## Status

Produktiv einsetzbar in der Entwicklungsumgebung (Vercel + Turso, EU). Detaillierter
Stand und offene Pakete: [`docs/ROADMAP.md`](docs/ROADMAP.md) und
[`docs/HANDOVER.md`](docs/HANDOVER.md).
