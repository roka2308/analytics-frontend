# Telekom-Integration & Handover

Leitfaden für die Überführung dieses Projekts in die Telekom-Infrastruktur.
Deckt die drei Design-Vorbereitungen ab plus eine Infra-Checkliste.

---

## 1. Marken-Schrift TeleNeoWeb

**Status: vorbereitet, wartet auf Font-Dateien.**

Die `@font-face`-Regeln stehen in `app/globals.css`, die Font-Family-Kette
ist `"TeleNeoWeb", var(--font-inter), system-ui, …`. Sobald die Dateien
unter `public/fonts/` liegen, greift TeleNeo automatisch.

→ Details: `public/fonts/README.md`. Dateien sind via `.gitignore`
ausgeschlossen (proprietär).

---

## 2. Design-Tokens aus `@telekom/design-tokens`

**Status: manuell 1:1 aus Scale gepflegt, Auto-Sync vorbereitet.**

Alle CSS-Variablen entsprechen den echten Scale-Tokens
(siehe `docs/DESIGN-TOKENS.md`). Für automatische Generierung:

```bash
npm i -D @telekom/design-tokens
node scripts/sync-design-tokens.mjs   # gibt :root{}-Block aus
```

Die Mapping-Pfade in `scripts/sync-design-tokens.mjs` ggf. an die finale
Paketstruktur anpassen. So bleibt ihr bei Scale-Updates automatisch synchron.

---

## 3. Offizielle Scale-Web-Components (`@telekom/scale-components`)

**Status: Integrationspfad dokumentiert.** Aktuell nutzt die App
shadcn-/Radix-Nachbauten, die exakt den Scale-Specs folgen (Farben, Radius,
Höhen, blauer Fokus). Wer die **offiziellen** Scale-Komponenten will:

### Caveat: SSR

Scale-Components sind Stencil-basierte Custom Elements. Sie rendern
**nicht serverseitig** in Next.js (App Router). Sie müssen client-seitig
geladen werden.

### Empfohlenes Muster (SSR-sicher)

```bash
npm i @telekom/scale-components
```

```tsx
// components/scale/ScaleProvider.tsx
"use client";
import { useEffect } from "react";

export function ScaleProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Custom Elements einmalig registrieren (nur im Browser)
    import("@telekom/scale-components/loader").then(({ defineCustomElements }) =>
      defineCustomElements(window)
    );
  }, []);
  return <>{children}</>;
}
```

```tsx
// In app/layout.tsx den ScaleProvider um den Body-Inhalt legen.
// Danach in CLIENT-Komponenten Scale-Elemente nutzen, z.B.:
//   <scale-button variant="primary">Speichern</scale-button>
// TypeScript: JSX-Typen via @telekom/scale-components/dist/types ergänzen.
```

### Migrationsreihenfolge (Empfehlung)

1. Buttons → `scale-button`
2. Inputs/Selects → `scale-text-field`, `scale-dropdown-select`
3. Notifications/Modals → `scale-notification`, `scale-modal`
4. Charts bleiben Tremor (Scale hat keine Chart-Lib)

Pro Komponente einzeln migrieren und testen – nicht alles auf einmal.

---

## 4. Infra-Handover-Checkliste

### Datenbank
- Aktuell **Turso** (hosted libSQL). Migrationen in `drizzle/`.
- Für Telekom-Infra: auf interne Postgres/MySQL umstellen.
  - `lib/db/index.ts` + `drizzle.config.ts` Dialekt anpassen
  - Drizzle unterstützt Postgres/MySQL nativ → Schema in `lib/db/schema.ts`
    weitgehend übernehmbar (SQLite-spezifische Typen prüfen)
  - Daten-Export aus Turso: `turso db shell <db> .dump` oder Drizzle-Studio

### Auth
- Aktuell **NextAuth (Credentials)** mit bcrypt in eigener `users`-Tabelle.
- Für Telekom: ggf. auf **SSO / OIDC** (Telekom-IdP) umstellen –
  NextAuth unterstützt OIDC-Provider direkt.

### Environment-Variablen
| Variable | Zweck |
|---|---|
| `DATABASE_URL` / `DATABASE_AUTH_TOKEN` | DB-Verbindung |
| `MATOMO_BASE_URL` / `MATOMO_API_TOKEN` | Matomo-Anbindung |
| `DEFAULT_MATOMO_SITE_ID` | Seed-Site |
| `NEXTAUTH_SECRET` / `NEXTAUTH_URL` | Auth |

### Deployment
- Aktuell **Vercel** (EU/fra1). Für Telekom-Infra:
  - Standard-Next.js-Build (`npm run build` + `npm run start`) oder Docker
  - `next.config.mjs` ggf. `output: "standalone"` für schlanke Container
  - Reverse Proxy (nginx) + Node-Runtime ≥ 20

### Secrets / Compliance
- Matomo-Token serverseitig halten (bereits `server-only`)
- Keine Tokens im Client-Bundle (per Design eingehalten)
- DSGVO: Matomo + App im EU-Raum betreiben
