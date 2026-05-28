# Matomo Analytics Frontend

Eigenes Web-Frontend für Matomo Analytics. Sauber, fokussiert, mandantenfähig.

## Was das Projekt macht

Verbindet sich mit einer bestehenden Matomo-Instanz und zeigt die wichtigsten Kennzahlen in einer klaren, modernen Oberfläche:

- **KPI-Karten:** Besuche, Seitenaufrufe, Bounce Rate, Ø Verweildauer
- **Besuchertrend:** Tägliches Liniendiagramm
- **Top-Seiten:** Meistbesuchte Seiten mit Aufrufzahlen
- **Zeitraum-Auswahl:** Heute / 7 Tage / 30 Tage / 90 Tage
- **Caching:** Matomo-Daten werden 10 Minuten lang zwischengespeichert (SQLite)
- **Multi-Tenancy:** Mehrere Organisationen, Nutzer (Admin/Viewer) und Sites
- **Authentifizierung:** E-Mail + bcrypt-gehashte Passwörter über NextAuth

## Stack

Next.js 14 (App Router, TypeScript) · Tailwind · shadcn/ui · Tremor (Charts)
NextAuth (Credentials) · Drizzle ORM · libSQL/SQLite · bcryptjs

## Voraussetzungen

- **Node.js 20 LTS** (https://nodejs.org)
- Matomo-Instanz mit aktivierter Reporting-API
- Matomo API-Token (Matomo → Profil → Sicherheit → Auth-Token)

## Setup (lokale Entwicklung)

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
| `DATABASE_URL` | `file:local.db` für lokale SQLite-Datei |
| `MATOMO_BASE_URL` | URL der Matomo-Instanz (z.B. `https://analytics.meine-domain.de`) |
| `MATOMO_API_TOKEN` | API-Token aus Matomo → Profil → Sicherheit |
| `DEFAULT_MATOMO_SITE_ID` | Site-ID der Hauptwebsite in Matomo (wird beim ersten Start als Seed-Site angelegt) |
| `NEXTAUTH_SECRET` | Beliebiger langer zufälliger Text (mind. 32 Zeichen) |
| `NEXTAUTH_URL` | `http://localhost:3000` für Entwicklung, Produktiv-URL für Live |

### 3. Datenbank initialisieren
```bash
npm run db:migrate
```

### 4. Entwicklungsserver starten
```bash
npm run dev
```

Öffne `http://localhost:3000` und folge dem **`/setup`-Flow**, um dein Admin-Konto anzulegen. Danach kannst du im Settings-Bereich Organisationen, Sites und weitere Nutzer verwalten.

## Projektstruktur

```
app/
  (auth)/dashboard/        # Haupt-Dashboard mit KPIs, Trend, Top-Seiten
  (auth)/settings/         # Org-, Site-, User-Verwaltung + Passwort
  api/auth/[...nextauth]/  # NextAuth-Endpunkte (Login/Logout/Session)
  login/                   # Login-Seite (E-Mail + Passwort)
  setup/                   # Einmaliger Bootstrap des ersten Admins
components/
  charts/                  # Tremor-Diagramme (VisitorTrendChart)
  dashboard/               # Header, KpiCard, SiteSelector, DateRangePicker
  settings/                # OrgList, SiteList, UserList, ChangePasswordForm
  setup/                   # SetupForm (erstmaliges Admin-Anlegen)
  login/                   # LoginForm
  providers/               # SessionProvider (Client-Wrapper für NextAuth)
  ui/                      # shadcn/ui Basis-Komponenten
lib/
  actions/                 # Server-Actions (Mutations)
    organizations.ts       # create/rename/delete (Admin-only)
    sites.ts               # add/remove (Admin-only)
    users.ts               # create/delete/reassign/changePassword
  auth/
    config.ts              # NextAuth Konfiguration (CredentialsProvider)
    requireUser.ts         # Server-side Auth-Helper inkl. assertSiteAccess
    users.ts               # User-DB-Helpers, bcrypt
  db/
    schema.ts              # Drizzle-Schema (organizations, matomo_sites, users, cache_entries)
    index.ts               # Drizzle-Client (libSQL/SQLite)
    queries.ts             # DB-Abfragen + Auto-Seed
  matomo/                  # Matomo API-Client (server-only!)
    client.ts              # HTTP-Wrapper mit Timeout & Fehlerbehandlung
    cache.ts               # SQLite-Cache (TTL 10 Min.)
    transforms.ts          # Matomo-Rohdaten → eigene Datenmodelle
types/                     # TypeScript-Typen + NextAuth-Augmentation
drizzle/                   # Auto-generierte SQL-Migrationen
```

## Meilensteine

| # | Inhalt | Status |
|---|---|---|
| M1 | Setup, NextAuth-Login, DB-Schema (Drizzle/SQLite) | ✅ |
| M2 | Matomo-Client, Cache-Layer, API-Route | ✅ |
| M3 | Dashboard-UI: KPIs, Trend (Tremor), Top-Seiten, Zeitraum-Auswahl | ✅ |
| M4.1 | Mehrere Sites verwalten, Site-Selector | ✅ |
| M4.2 | Echte Nutzerkonten (E-Mail + bcrypt), Setup-Flow | ✅ |
| M4.3 | Multi-Org-Verwaltung, rollenbasierte Sicht (Admin/Viewer) | ✅ |
| M5 | Erweiterte KPIs, Design-Refinement, Produktiv-Deployment | 🚧 |

## Rollen & Berechtigungen

- **Admin:** verwaltet Organisationen, Websites und Nutzer. Sieht im Dashboard alle Sites aller Orgs (gruppiert nach Org-Name).
- **Viewer:** sieht nur die Sites der eigenen Organisation. Kann das eigene Passwort ändern.

`assertSiteAccess` prüft DB-seitig bei jedem Datenaufruf, dass ein Viewer nicht auf fremde Sites zugreifen kann – auch nicht per manuell zusammengebauter URL.

## Wichtige Regeln

- **Matomo-Token NIE im Client-Code** – nur in Server Components / Server Actions / API-Routes
- **`.env.local` niemals committen** – steht in `.gitignore`
- **Nach jedem Meilenstein git commit** – jeder Commit ist ein funktionierender Stand
- **Server-Actions immer mit `requireUser` / `requireAdmin` absichern** – Viewer dürfen keine Mutationen auslösen

## Skripte

| Befehl | Zweck |
|---|---|
| `npm run dev` | Entwicklungsserver auf Port 3000 |
| `npm run build` | Produktiv-Build |
| `npm run start` | Produktiv-Server (nach `build`) |
| `npm run lint` | ESLint |
| `npm run db:generate` | Drizzle-Migration aus Schema-Änderungen erzeugen |
| `npm run db:migrate` | Migrationen auf DB anwenden |
| `npm run db:push` | Schema direkt pushen (nur für Entwicklung) |
