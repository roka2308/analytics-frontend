# Design-Token-Mapping (Telekom Scale → App)

Diese Datei dokumentiert **lückenlos**, welche CSS-Variable in
`app/globals.css` welchem Scale-Token entspricht. Quelle der Werte:
[`telekom/scale` › `packages/design-tokens`](https://github.com/telekom/scale/blob/main/packages/design-tokens/src/telekom/tokens.js)
sowie das npm-Paket [`@telekom/design-tokens`](https://www.npmjs.com/package/@telekom/design-tokens).

> Ziel: Wenn das Projekt in die Telekom-Infrastruktur wandert, kann das
> Team die CSS-Variablen aus `@telekom/design-tokens` **automatisch
> generieren** (siehe `scripts/sync-design-tokens.mjs`). Bis dahin sind
> die Werte hier manuell, aber 1:1 aus den Scale-Tokens übernommen.

## Farben

| CSS-Variable | Scale-Token | Hex (Light) | Hex (Dark) |
|---|---|---|---|
| `--accent` | `color.primary` | `#E20074` | heller (`329 100% 52%`) |
| `--accent-hover` | `color.primaryActive` | `#CB0068` | `329 100% 58%` |
| `--accent-text` | `color.primaryActive` | `#CB0068` | `329 100% 72%` |
| `--ring` (Fokus) | `color.focus` (blue50) | `#3D8CFF` | `#3D8CFF` |
| `--foreground` | `grey90` | `#191919` | `grey0` `#F2F2F2` |
| `--muted-foreground` | `grey60` | `#666666` | `grey40` `#999999` |
| `--muted` / `--secondary` | `grey0` | `#F2F2F2` | `grey80`-Bereich |
| `--border` | `grey10` | `#E5E5E5` | dunkler |
| `--input` | `grey20` | `#CCCCCC` | dunkler |
| `--success` | `green100` | `#187431` | aufgehellt |
| `--warning` | `orange70` | `#DF6D3F` | aufgehellt |
| `--destructive` | `red70` | `#D82A48` | aufgehellt |

## Chart-Palette (Scale-Funktionsfarben)

| Variable | Scale | Hex |
|---|---|---|
| `--chart-1` | primary (Magenta) | `#E20074` |
| `--chart-2` | blue50 | `#3D8CFF` |
| `--chart-3` | teal60 | `#22ADB9` |
| `--chart-4` | green80 | `#32A032` |
| `--chart-5` | orange70 | `#DF6D3F` |

## Radius

Scale `RADIUS` = `{1, 2, 4, 8, 12}` px. Unsere `--radius` = **0.5rem (8px)**
als „standard". Abgeleitet: `sm` 4px, `md` 6px, `lg` 8px.

## Typografie

| Aspekt | Scale-Token | Umsetzung |
|---|---|---|
| Schrift | `family.sans` = `TeleNeoWeb` | `@font-face` in globals.css, Fallback Inter |
| Heading-Gewicht | `weight.extrabold` = 800 | `.heading-display` Utility |
| Body-Gewicht | `weight.medium` = 500 | Standard 400 (bewusst, Lesbarkeit) |
| Body-Größe | `size.16` | `text-base` |

## Spacing

Scale `SPACING` = `{1,2,4,8,12,16,24,32,40,48,64,80}` px – deckt sich mit
der Tailwind-Default-Skala (0.25rem-Schritte), daher keine Sonder-Tokens nötig.

## Schatten

Scale `SHADOW.level[1]` (Card) = zwei Layer (`y4 blur16` + `y2 blur4`).
Umsetzung in `components/ui/card.tsx`.
