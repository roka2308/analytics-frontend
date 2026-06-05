/**
 * Sync-Gerüst: Scale-Design-Tokens -> CSS-Variablen.
 *
 * STATUS: Vorbereitung für die Telekom-Infrastruktur. Aktuell sind die
 * CSS-Variablen in app/globals.css manuell aus den Scale-Tokens gepflegt
 * (siehe docs/DESIGN-TOKENS.md). Dieses Skript zeigt den Pfad zur
 * automatischen Generierung, sobald @telekom/design-tokens als Dependency
 * verfügbar ist.
 *
 * Nutzung (nach `npm i -D @telekom/design-tokens`):
 *   node scripts/sync-design-tokens.mjs
 *
 * Das Skript liest die Scale-Tokens und gibt einen :root{}-Block mit
 * unseren CSS-Variablen aus, den man in app/globals.css übernehmen kann.
 */

// Hex -> "H S% L%" (Format unserer CSS-Variablen)
function hexToHslTriplet(hex) {
  const clean = hex.replace(/^#/, "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Mapping: unsere Variable  <-  Scale-Token-Pfad (in @telekom/design-tokens)
// Diese Pfade ggf. an die finale Paket-Struktur anpassen.
const MAPPING = {
  "--accent": "color.primary", // #E20074
  "--accent-hover": "color.primaryActive", // #CB0068
  "--accent-text": "color.primaryActive",
  "--ring": "color.focus", // blue50 #3D8CFF
  "--foreground": "color.grey90",
  "--muted-foreground": "color.grey60",
  "--muted": "color.grey0",
  "--border": "color.grey10",
  "--input": "color.grey20",
  "--success": "color.green100",
  "--warning": "color.orange70",
  "--destructive": "color.red70",
};

async function main() {
  let tokens;
  try {
    // Erwartete API – an die tatsächliche Paket-Struktur anpassen.
    const mod = await import("@telekom/design-tokens");
    tokens = mod.default ?? mod;
  } catch {
    console.error(
      "✗ @telekom/design-tokens ist nicht installiert.\n" +
        "  Installiere es mit:  npm i -D @telekom/design-tokens\n" +
        "  Bis dahin sind die Werte manuell in app/globals.css gepflegt\n" +
        "  (siehe docs/DESIGN-TOKENS.md)."
    );
    process.exit(1);
  }

  console.log("/* Auto-generiert aus @telekom/design-tokens */");
  console.log(":root {");
  for (const [cssVar, tokenPath] of Object.entries(MAPPING)) {
    const hex = tokenPath
      .split(".")
      .reduce((o, k) => (o ? o[k] : undefined), tokens);
    if (typeof hex === "string" && /^#?[0-9a-fA-F]{6}$/.test(hex)) {
      console.log(`  ${cssVar}: ${hexToHslTriplet(hex)}; /* ${tokenPath} ${hex} */`);
    } else {
      console.log(`  /* TODO: ${cssVar} <- ${tokenPath} (Pfad pruefen) */`);
    }
  }
  console.log("}");
}

main();
