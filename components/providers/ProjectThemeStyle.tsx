import { deriveAccentVariants } from "@/lib/branding";

interface Props {
  /** HSL-Tripel "H S% L%" oder null fuer Default-Theme */
  accentHsl: string | null;
  children: React.ReactNode;
}

/**
 * Wrapped die children in einem div, das via inline-style die
 * Theme-CSS-Variablen pro Projekt ueberschreibt.
 *
 * Wenn accentHsl null ist, wird der Standard-Magenta-Akzent verwendet
 * (kein Override).
 */
export function ProjectThemeStyle({ accentHsl, children }: Props) {
  const variants = accentHsl ? deriveAccentVariants(accentHsl) : null;

  if (!variants) {
    // Kein Override – nur passthrough
    return <>{children}</>;
  }

  const style: React.CSSProperties & Record<`--${string}`, string> = {
    "--accent": variants.accent,
    "--accent-hover": variants.accentHover,
    "--accent-text": variants.accentText,
    // Chart-1 (primaere Diagramm-Farbe) ebenfalls auf Projekt-Akzent setzen
    "--chart-1": variants.accent,
  };

  return <div style={style}>{children}</div>;
}
