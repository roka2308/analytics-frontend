/**
 * Branding-Utility: Konvertierung zwischen Hex/HSL, Validierung, Defaults.
 *
 * Unsere CSS-Variablen erwarten HSL-Tripel ohne hsl()-Wrapper:
 *   --accent: 330 78% 50%
 *
 * Im UI nutzen wir Hex (#RRGGBB) – ist intuitiver fuer Color-Picker.
 * Beim Speichern konvertieren wir Hex -> HSL.
 */

export const DEFAULT_ACCENT_HEX = "#E0008A"; // ungefaehr Magenta-Standard
export const MAX_LOGO_BYTES = 200_000; // ~200 KB Base64-encoded
export const ALLOWED_LOGO_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/svg+xml",
  "image/webp",
]);

// ──────────────────────────────────────────────────────────────
// Hex <-> HSL
// ──────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace(/^#/, "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return [r, g, b];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)); break;
      case gn: h = ((bn - rn) / d + 2); break;
      case bn: h = ((rn - gn) / d + 4); break;
    }
    h *= 60;
  }
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

export function hexToHsl(hex: string): string | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const [h, s, l] = rgbToHsl(...rgb);
  return `${h} ${s}% ${l}%`;
}

export function hslToHex(hslTriplet: string): string | null {
  const m = hslTriplet.match(/^(\d+)\s+(\d+)%\s+(\d+)%$/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const s = parseInt(m[2], 10);
  const l = parseInt(m[3], 10);
  const [r, g, b] = hslToRgb(h, s, l);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

// ──────────────────────────────────────────────────────────────
// Akzent-Varianten ableiten
// ──────────────────────────────────────────────────────────────

/**
 * Aus einem HSL-Akzent leite ich drei abgeleitete Toene ab:
 *  - accent (Basis)
 *  - accent-hover (etwas dunkler)
 *  - accent-text (deutlich dunkler, WCAG-tauglich auf Weiss)
 *
 * Im Dark Mode: invertierte Logik (heller statt dunkler).
 */
export interface AccentVariants {
  accent: string;
  accentHover: string;
  accentText: string;
}

export function deriveAccentVariants(hslTriplet: string): AccentVariants | null {
  const m = hslTriplet.match(/^(\d+)\s+(\d+)%\s+(\d+)%$/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const s = parseInt(m[2], 10);
  const l = parseInt(m[3], 10);
  return {
    accent: `${h} ${s}% ${l}%`,
    accentHover: `${h} ${s}% ${Math.max(20, l - 5)}%`,
    accentText: `${h} ${s}% ${Math.max(25, l - 13)}%`,
  };
}

// ──────────────────────────────────────────────────────────────
// Chart-Palette aus Akzentfarbe ableiten (#13)
// ──────────────────────────────────────────────────────────────

export interface ChartPalette {
  /** 6 HSL-Tripel fuer --chart-1 .. --chart-6 (Light Mode) */
  light: string[];
  /** Hellere Varianten fuer Dark Mode */
  dark: string[];
}

/**
 * Hue-Abstaende zur Akzentfarbe. Gewaehlt fuer maximale Unterscheidbarkeit
 * benachbarter Segmente (Donut/Balken) bei beliebigem Start-Hue.
 * chart-1 bleibt exakt die Akzentfarbe (konsistent zu Buttons/Links).
 */
const HUE_OFFSETS = [0, 210, 150, 60, 285, 105];

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export function deriveChartPalette(hslTriplet: string): ChartPalette | null {
  const m = hslTriplet.match(/^(\d+)\s+(\d+)%\s+(\d+)%$/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const s = parseInt(m[2], 10);
  const l = parseInt(m[3], 10);

  const light: string[] = [];
  const dark: string[] = [];
  HUE_OFFSETS.forEach((offset, i) => {
    const hue = (h + offset) % 360;
    if (i === 0) {
      // Akzentfarbe unveraendert uebernehmen
      light.push(`${hue} ${s}% ${l}%`);
      dark.push(`${hue} ${s}% ${clamp(l + 14, 0, 72)}%`);
      return;
    }
    // Abgeleitete Toene: Saettigung/Helligkeit in chart-taugliche Bereiche
    // ziehen, sonst werden Begleitfarben bei sehr dunklen/grellen
    // Akzentfarben unleserlich.
    const sat = clamp(s, 45, 88);
    const lig = clamp(l, 40, 58);
    light.push(`${hue} ${sat}% ${lig}%`);
    dark.push(`${hue} ${clamp(sat - 8, 40, 80)}% ${clamp(lig + 14, 50, 70)}%`);
  });
  return { light, dark };
}

// ──────────────────────────────────────────────────────────────
// Logo-Validierung
// ──────────────────────────────────────────────────────────────

export interface ValidationResult {
  ok: boolean;
  error?: string;
}

export function validateLogoDataUrl(dataUrl: string): ValidationResult {
  if (!dataUrl.startsWith("data:")) {
    return { ok: false, error: "Logo muss als Data-URL übermittelt werden." };
  }
  const match = dataUrl.match(/^data:([^;]+);base64,/);
  if (!match) {
    return { ok: false, error: "Logo-Format unbekannt (Base64 erwartet)." };
  }
  const mime = match[1].toLowerCase();
  if (!ALLOWED_LOGO_MIME.has(mime)) {
    return {
      ok: false,
      error: `Dateityp ${mime} nicht erlaubt. Erlaubt: PNG, JPG, SVG, WebP.`,
    };
  }
  if (dataUrl.length > MAX_LOGO_BYTES) {
    return {
      ok: false,
      error: `Logo zu groß (${Math.round(dataUrl.length / 1024)} KB, max ${Math.round(
        MAX_LOGO_BYTES / 1024
      )} KB).`,
    };
  }
  return { ok: true };
}
