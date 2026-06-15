# Roadmap / Arbeitspakete

> Abgeleitet aus dem ursprünglichen Projekt-Briefing. Diese Datei ist die
> kanonische To-Do-Liste – auch für die Übergabe an Kolleg:innen.
> Status-Legende: ✅ erledigt · 🟡 teilweise · ⬜ offen · ⛔ extern blockiert

## Produktziel

Aus dem Matomo-PoC wird ein **verkaufbares, mandantenfähiges White-Label-
Analytics-Produkt**: mehrere Datenquellen, saubere Kunden-/Projekt-/Nutzer-
struktur, flexible Dashboards mit voller Matomo-Tiefe, pro-Kunde-Branding.
Querschnitt **immer**: Mobile-tauglich, Sicherheit, übergabefähig. Bis auf
Weiteres in der Entwicklungsumgebung (Überführung in Unternehmens-Infra später).

---

## 1. Mehrere Datenquellen

| | Paket | Status |
|---|---|---|
| | Datenquellen-Abstraktion (gemeinsames Interface + Registry) | ✅ |
| | MatomoDataSource hinter dem Interface | ✅ |
| | SqlDataSource verdrahtet (5 Views, Server-Route) | 🟡 (live-Test offen) |
| #6 | SQL live anbinden + im Renderer darstellen + kombinierte Matomo+SQL-View (= Dashboard der Kollegin im Frontend) | ⛔ DB liegt bei Kollegin |
| #7 | Weitere Quellen: Kunden-eigenes Matomo, Google Analytics (GA4), Mapp Intelligence, Piano Analytics | ⬜ |

## 2. Struktur: Kunde → Projekt → Datenquelle → Dashboard

| | Paket | Status |
|---|---|---|
| | Datenmodell + Live-Migration (customers, data_sources, access_grants) | ✅ |
| | Render-Pfad auf data_sources umgestellt | ✅ |
| #5 | Cleanup-Migration: `matomo_sites` droppen (+ separat `users.organizationId`) | ⬜ (nach Live-Check) |

## 3. Verwaltung / Backend-Professionalisierung

| | Paket | Status |
|---|---|---|
| | Kunden-Verwaltung `/kunden` + Kunden-Übersicht | ✅ |
| | Nutzer-/Rechtemodell (Admin/Creator/Viewer, Viewer auf einzelne Dashboards) | ✅ |
| | Zugriffsrechte-Verwaltung `/zugriffe` | ✅ |
| #8 | Settings in strukturierte Unterseiten aufteilen (One-Pager auflösen) | ⬜ |
| #9 | Datenquellen-Verwaltungs-UI pro Projekt (alle Typen) + Projekt-Branding-Override-UI | ⬜ |

## 4. Frontend-Tiefe

| | Paket | Status |
|---|---|---|
| #10 | Matomo-API ausschöpfen: alle Dimensionen & Metriken, frei kombinier-/pivotierbar | ✅ (Report-Explorer + Pivot/Gruppiert, metadaten-getrieben) |
| #11 | Widgets überarbeiten & ausbauen | ✅ (Report-Explorer mit 8 Darstellungen; breakdown/donut/bar katalog-fähig) |
| #12 | Dashboard-Templates: speichern & für andere Projekte wiederverwenden | ✅ (Library /templates + Cache-Vorwärmen) |

## 5. Customization / Branding

| | Paket | Status |
|---|---|---|
| | Branding Kunde-Default + Projekt-Override (Datenmodell + Vererbung) | ✅ |
| #13 | Kundenfarben bis in die Widget-/Chart-Farben durchschlagen | ✅ (6er-Palette aus Akzent abgeleitet, Tremor+Recharts, Dark-Variante) |

## 6. Querschnitt (immer mitdenken)

| | Paket | Status |
|---|---|---|
| #14 | Mobile-View durchgängig optimieren | 🟡 (Drawer da) |
| #15 | Security-Durchgang (u.a. Matomo-Token rotieren, Härtung) | ⬜ |

## 7. Später / zurückgestellt

| | Paket | Status |
|---|---|---|
| #16 | TeleNeo-Font einbinden (Dateien fehlen) | ⬜ |
| #17 | Export: PDF / PowerPoint / Widget-Screenshot (Phase J) | ⬜ |

---

## Aktueller Stand (Juni 2026)

Datenmodell-Umbau (Kunde→Projekt→Datenquelle→Dashboard) **live**; `matomo_sites`
ist gedroppt (Migration 0010), Render-Pfad läuft über `data_sources`. Verwaltung
(#8/#9), Analytics-Engine + Report-Explorer (#10/#11), Templates (#12) und Branding
bis in die Chart-Farben (#13) sind **erledigt + deployed**.

Zuletzt: UI-Politur (Portal-Modal, einheitliche Selects, Fokusring `--ring`),
**Design-Modernisierung** aus dem Claude-Design-Handoff (eckige Charts, moderne
KPI-Tiles, neues **Hero-Metrik-Widget**, Entrance-Motion) und die **Branchen-
Vorlagen wieder angeschlossen** (Picker beim Dashboard-Anlegen, Hero oben).

**Offen / als Nächstes:** #14 Mobile durchgängig, #15 Security-Durchgang (Matomo-
Token rotieren, Härtung), #6 SQL live (DB bei Kollegin), #7 weitere Quellen (GA4/
Mapp/Piano), #16 TeleNeo-Font (Dateien fehlen), #17 Export (PDF/PPTX). Kleinerer
Rest: ungenutzte `createDashboardAction` entfernen; `users.organizationId` final
droppen (deprecated).
