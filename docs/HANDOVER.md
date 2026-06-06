# Projekt-Übergabe / Kontext für neue KI-Session

> **Zweck dieses Dokuments:** Damit eine KI in einem frischen Kontextfenster
> nahtlos weiterarbeiten kann. Bitte zuerst komplett lesen.

---

## 1. Was ist das Projekt?

**Matomo Analytics Frontend** – eine mandantenfähige White-Label-Dashboard-
Plattform. Sie holt Daten aus einer bestehenden **Matomo-Instanz**, bereitet
sie auf und zeigt sie in kuratierten, gut gestalteten Dashboards. Endkunden
(z. B. Geschäftsführung, Marketing) sehen fokussierte KPIs statt der komplexen
Matomo-Oberfläche.

**Wichtiger Kontext:** Der Auftraggeber (Robert) arbeitet **für die Deutsche
Telekom** und wird das Projekt in die Telekom-Infrastruktur überführen. Das
Design folgt daher dem **Telekom Scale Design System** (Magenta, blauer Fokus,
extrabold Headings). Marken-/Lizenzfrage ist geklärt (autorisiert).

**Nutzer-Profil Robert:** Consultant, **kein Entwickler**. Erklärungen kurz und
verständlich halten, Entscheidungen begründen, proaktiv Verbesserungen
vorschlagen. Deutsch.

---

## 2. Tech-Stack

- **Next.js 14** (App Router, TypeScript) – Fullstack
- **Tailwind CSS** + **shadcn/ui**-Nachbauten (Radix-basiert)
- **Tremor** (Donut, BarList) + **Recharts** (Linien-Charts, Sparklines)
- **NextAuth** (Credentials, bcrypt) – eigene `users`-Tabelle
- **Drizzle ORM** + **libSQL/SQLite**, Produktion: **Turso** (EU/fra)
- **react-grid-layout** (In-Place-Dashboard-Editor)
- **next-themes** (Light/Dark)
- Hosting: **Vercel** (EU/fra1), Live: `analytics-frontend-woad.vercel.app`
  (eigene Domain `analytics.pixel-test.com` geplant, DNS via Cloudflare offen)
- Repo: `github.com/roka2308/analytics-frontend` (main = Produktion)

---

## 3. Architektur (3 Schichten)

```
Matomo (unverändert)  →  Next.js Backend (Server Components + Actions)  →  Frontend
                          hält Token, cached, normalisiert
```

### Wichtige Verzeichnisse
```
app/
  (auth)/projekte/[orgSlug]/dashboards/[slug]/        # Haupt-Dashboard (View)
  (auth)/projekte/[orgSlug]/dashboards/[slug]/edit/   # In-Place-Grid-Editor
  (auth)/settings/                                    # Projekte, Dashboards, Sites, User, Branding
  share/[token]/                                      # Public Read-Only ohne Login
  login/ setup/ page.tsx                              # Auth + Landing
  globals.css                                         # Theme-Tokens (Scale) + TeleNeo @font-face
lib/
  db/schema.ts, queries.ts, index.ts                  # Drizzle
  matomo/client.ts, cache.ts, transforms.ts           # Matomo-Anbindung (server-only!)
  auth/config.ts, requireUser.ts, users.ts            # NextAuth + Guards
  actions/                                            # Server-Actions (sites, users, orgs, dashboards, widgets, sections, branding, sharing)
  widgets/registry.ts (server), meta.ts (client), types.ts, templates.ts, seed.ts
  metrics/registry.ts                                 # Metrik-Lexikon (Tooltips)
  dateRange.ts                                        # Zeitraum + Vergleich
  branding.ts, useChartColors.ts
components/
  layout/ (AppShell, Sidebar, SidebarNav, Topbar)
  dashboard/ (DashboardRenderer, DashboardGrid, Pickers, MetricInfo, ...)
  widgets/ (WidgetCard + 8 Widget-Typen)
  charts/ (VisitorTrendChart, SparklineClient, DonutChartClient, BarListClient, InlineBar)
  editor/ (DashboardGridEditor, WidgetConfigForm, grid-editor.css)
  settings/ (OrgList, SiteList, UserList, DashboardList, ProjectBrandingForm, ShareLinksEditor, ...)
  ui/ (shadcn: button, card, input, select, dropdown-menu, popover, table, ...)
docs/  DESIGN-TOKENS.md, TELEKOM-INTEGRATION.md, HANDOVER.md (dieses)
```

---

## 4. Datenmodell (Drizzle, `lib/db/schema.ts`)

- **organizations** = „Projekte" (UI-Begriff). Felder: id, name, slug (unique),
  brandingLogoBase64, brandingAccentHsl
- **matomo_sites**: organizationId, matomoSiteId, label
- **users**: email, passwordHash (bcrypt), role (admin|viewer), organizationId
- **dashboards**: organizationId, slug, name, isDefault, position,
  defaultRangePreset/From/To, defaultCompareMode
- **dashboard_widgets**: dashboardId, sectionId(nullable), type, title,
  layout (JSON {x,y,w,h}), config (JSON), position
- **dashboard_sections**: dashboardId, title, description, position (UI dafür
  existiert noch NICHT im Grid-Editor – Infrastruktur liegt bereit)
- **dashboard_share_tokens**: dashboardId, token, label, matomoSiteId,
  expiresAt, revokedAt
- **cache_entries**: cacheKey (unique), payload, expiresAt (Matomo-Cache, TTL 600s)

Migrationen: `drizzle/0000` … `0008`.

---

## 5. ⚠️ KRITISCHE Workflow-Konventionen (unbedingt einhalten)

1. **Build vor jedem Commit.** `npm run build` muss grün sein. Bei TS-Fehlern
   fixen, nicht committen.
2. **Direkt auf `main` committen + pushen.** Vercel deployt automatisch von
   main. (Kein PR-Flow etabliert.)
3. **Commit-Messages per Datei**, nicht inline in PowerShell:
   `git commit -F /tmp/cm.txt`. **Grund:** PowerShell zerbricht an Klammern,
   Slashes, Umlauten in `-m`-Strings. Heredoc in Bash funktioniert.
   Commit-Stil: `feat(phase-x): …` / `fix(...)` mit Co-Authored-By-Trailer.
4. **Turso-Migrationen** nach jeder Schema-Änderung:
   - `.env.local` temporär auf Turso-Werte umstellen
     (`DATABASE_URL=libsql://…`, `DATABASE_AUTH_TOKEN=…`)
   - `npm run db:generate` (erzeugt SQL) + `npm run db:migrate`
     (eigenes Skript `scripts/migrate-turso.mjs`, idempotent)
   - `.env.local` zurück auf `file:local.db`
   - **Sonst crasht die Live-Version** (fehlende Spalte/Tabelle).
   - Lokal liegt eine SQLite-Datei; das Skript lädt `.env.local` via dotenv.
5. **Deutsche Sonderzeichen in TS-Strings:** „typografische Anführungszeichen"
   (U+201E/U+201C) **brechen** TS-String-Literale → Build-Fehler.
   In Code-Strings nur ASCII-Quotes oder gar keine. (Mehrfach passiert.)
6. **Tremor-Farben:** brauchen die **Safelist** in `tailwind.config.ts`
   (sonst grau, weil Tailwind die Laufzeit-Klassen purged). Neue Chart-Farbe
   → Farbe zur Safelist-Regex hinzufügen.
7. **Widget-Registry-Split:** `lib/widgets/registry.ts` (mit Komponenten,
   server-only über Matomo-Importe) NICHT in Client-Komponenten importieren.
   Client (Editor) nutzt `lib/widgets/meta.ts` (nur Metadaten, kein server-only).
8. **PowerShell-Eigenheiten** (Windows): keine `&&`-Ketten, `Select-Object
   -Last N` statt `tail`, Build kann lange laufen (Timeout großzügig).

---

## 6. Design-System (Telekom Scale)

Alles über **CSS-Variablen** in `app/globals.css` (Light + Dark), gemappt aus
den echten Scale-Tokens – siehe `docs/DESIGN-TOKENS.md`.

- **Magenta** `#E20074` = `--accent` (Primäraktionen, Buttons, Charts)
- **Fokus blau** `#3D8CFF` = `--ring` (NICHT Magenta – Scale-Konvention)
- **Grautöne** = Telekom grey-Skala
- **Headings extrabold** via `.heading-display`-Utility
- **Radius** 8px, **Schatten** mehrschichtig (Scale Level-1)
- **Buttons** Magenta, ~44px hoch, bold
- **TeleNeo-Font:** `@font-face` liegt bereit; Dateien fehlen (proprietär) →
  Fallback Inter. Dateien nach `public/fonts/` legen, dann automatisch aktiv.
- **Regel:** Komponenten nutzen NUR Theme-Tokens (`bg-accent`, `text-foreground`,
  …), NIE hardcoded Farben (kein `slate-900`, `#fff`).
- **Pro-Projekt-Branding:** `ProjectThemeStyle` überschreibt `--accent`-Tokens
  per Inline-Style im Projekt-Layout (Logo + Akzentfarbe).

---

## 7. Widget-System – wie man ein neues Widget hinzufügt

1. Komponente `components/widgets/XyzWidget.tsx` (Server Component,
   `WidgetProps<Config>`, in `WidgetCard`-Hülle).
2. In `lib/widgets/registry.ts` eintragen (type, component, defaultConfig,
   defaultLayout, configSchema).
3. In `lib/widgets/meta.ts` **denselben** Eintrag ohne Komponente
   (label, description, defaultConfig, defaultLayout, configSchema).
4. Optional: Metrik-Texte in `lib/metrics/registry.ts` für Tooltip.
5. Fertig – Editor (Palette + Config-Form) und Renderer greifen automatisch.

**8 vorhandene Typen:** kpi-card, line-chart, top-list, text-block, breakdown,
donut, bar-chart, cross-tab.

**Render-Kontext** (`WidgetRenderContext`): siteId, range (DateRangeValue),
compareRange. Matomo-Calls laufen über `lib/matomo/transforms.ts` (gecacht).

---

## 8. Was ist fertig (Phasen)

| Phase | Inhalt | Status |
|---|---|---|
| M1–M3 | Setup, Auth, Matomo-Client, Cache, erstes Dashboard | ✅ |
| M4.1–4.3 | Multi-Site, echte User (bcrypt), Multi-Org/Rollen | ✅ |
| Deployment | GitHub, Turso, Vercel (EU) | ✅ |
| A | Theme-Fundament (Light/Dark, CSS-Variablen) | ✅ |
| B | Widget-Architektur (Registry, 4 Basis-Widgets, Multi-Dashboard) | ✅ |
| C | Vergleichszeiträume + freie Datumsauswahl | ✅ |
| C.5 | Projekt-Selektor, Routen `/projekte/[slug]/…` | ✅ |
| D | White-Label pro Projekt (Logo + Akzentfarbe) | ✅ |
| E | Metrik-Tooltips (Beschreibung + Handlungsempfehlungen) | ✅ |
| F | Default-Zeitraum pro Dashboard | ✅ |
| G | Branchen-Templates (Shop, B2B, Content, Landing, SaaS, Intranet) | ✅ |
| H | 4 neue Widgets: breakdown, donut, bar-chart, cross-tab (Pivot) | ✅ |
| K | Share-Links ohne Login (Token, Ablauf, Widerruf) | ✅ |
| I.1 | Layout-Modell + Sections (DB), Widget-CRUD | ✅ |
| I.2 | In-Place-Drag-Drop-Editor (react-grid-layout, Seiten-Panel) | ✅ |
| Design | Sidebar-Layout, Mobile-Drawer, Scale-Tokens, lineare Charts mit Punkten + Gradient, Editor-Raster | ✅ |

---

## 9. Was offen / als Nächstes denkbar ist

- **TeleNeo-Font** einbinden (sobald Dateien da) – Gerüst steht.
- **Phase J – Export:** PDF des Dashboards, PowerPoint-Template-Export,
  Screenshot pro Widget. (Bewusst zurückgestellt.)
- **Sections im Grid-Editor sichtbar machen** (DB-Struktur existiert).
- **Phase L – Benchmarks** über alle Projekte (sehr später).
- **Weitere QoL:** Annotations im Chart, Goals pro KPI, Scheduled Reports,
  i18n-Struktur, Anomalie-Alerts.
- **Editor-Raster pixelgenau** an RGL-Spalten koppeln (aktuell dezent/approx).
- **Mehr KPIs/Matomo-Methoden** nach Kundenbedarf (Conversions, Funnels).
- **Überführung in Telekom-Infra:** siehe `docs/TELEKOM-INTEGRATION.md`
  (DB→Postgres, Auth→OIDC, Docker-Deployment).
- **Unique Visitors bei period=range** = 0 (Matomo-Limitierung) – ggf. lösen.
- **Matomo-Token rotieren** (war im Chat sichtbar) – Sicherheits-To-do.

---

## 10. Setup für lokale Entwicklung

```bash
npm install
# .env.local anlegen (siehe .env.example):
#   DATABASE_URL=file:local.db
#   MATOMO_BASE_URL, MATOMO_API_TOKEN, DEFAULT_MATOMO_SITE_ID
#   NEXTAUTH_SECRET, NEXTAUTH_URL=http://localhost:3000
npm run db:migrate     # legt lokale SQLite-Tabellen an
npm run dev            # http://localhost:3000 → /setup (erster Admin)
```

Node.js liegt unter `D:\nodejs`. Arbeitsverzeichnis: `J:\Webseiten\Analytics Frontend`.

---

## 11. Verwandte Dokumente
- `docs/DESIGN-TOKENS.md` – Mapping CSS-Variablen ↔ Scale-Tokens
- `docs/TELEKOM-INTEGRATION.md` – Font, Scale-Components, Infra-Handover
- `public/fonts/README.md` – TeleNeo-Font-Dateien
- `README.md` – Setup-Grundlagen
