import { deriveAccentVariants, deriveChartPalette } from "@/lib/branding";

interface Props {
  /** HSL-Tripel "H S% L%" oder null fuer Default-Theme */
  accentHsl: string | null;
  children: React.ReactNode;
}

/**
 * Wrapped die children in einem div, das die Theme-CSS-Variablen pro
 * Projekt/Kunde ueberschreibt: Akzentfarbe + komplette Chart-Palette
 * (--chart-1..6), abgeleitet aus der Branding-Farbe (#13).
 *
 * Statt Inline-Style ein <style>-Block, damit der Dark Mode eigene
 * (hellere) Palette-Werte bekommt – Inline-Styles koennen nicht auf
 * die .dark-Klasse reagieren.
 *
 * Sicherheit: Es werden NIE rohe DB-Werte ins CSS geschrieben – die
 * derive*-Funktionen parsen per Regex und bauen die Tripel aus Zahlen
 * neu zusammen. Ungueltige Werte => kein Override.
 *
 * Wenn accentHsl null ist, gilt das Standard-Theme (Telekom Scale).
 */
export function ProjectThemeStyle({ accentHsl, children }: Props) {
  const variants = accentHsl ? deriveAccentVariants(accentHsl) : null;
  const palette = accentHsl ? deriveChartPalette(accentHsl) : null;

  if (!variants || !palette) {
    // Kein Override – nur passthrough
    return <>{children}</>;
  }

  const chartVars = (values: string[]) =>
    values.map((v, i) => `--chart-${i + 1}: ${v};`).join(" ");

  // Scope ueber den (sanitisierten) Akzent-Wert, damit auch zwei
  // verschiedene Themes auf einer Seite sich nicht ueberschreiben.
  const scope = variants.accent;
  const css = `
[data-project-theme="${scope}"] {
  --accent: ${variants.accent};
  --accent-hover: ${variants.accentHover};
  --accent-text: ${variants.accentText};
  ${chartVars(palette.light)}
}
.dark [data-project-theme="${scope}"] {
  ${chartVars(palette.dark)}
}`;

  return (
    <div data-project-theme={scope}>
      <style>{css}</style>
      {children}
    </div>
  );
}
