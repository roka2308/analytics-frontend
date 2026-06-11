"use client";

import { useEffect, useState } from "react";

export interface ChartColors {
  accent: string;
  compare: string;
  axis: string;
  grid: string;
  /** Serien-Palette --chart-1..6 (folgt Kunden-/Projekt-Branding) */
  palette: string[];
}

const PALETTE_FALLBACKS = [
  "hsl(329 100% 44%)",
  "hsl(216 100% 62%)",
  "hsl(185 69% 43%)",
  "hsl(120 52% 41%)",
  "hsl(17 72% 56%)",
  "hsl(262 60% 55%)",
];

function read(varName: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  // Projekt-Branding ueberschreibt die Variablen auf einem Wrapper-Div
  // ([data-project-theme]), nicht auf <html> -> dort lesen, falls vorhanden.
  const scope =
    document.querySelector("[data-project-theme]") ?? document.documentElement;
  const raw = getComputedStyle(scope).getPropertyValue(varName).trim();
  return raw ? `hsl(${raw})` : fallback;
}

function resolve(): ChartColors {
  return {
    accent: read("--accent", "hsl(329 100% 44%)"),
    compare: read("--muted-foreground", "hsl(0 0% 40%)"),
    axis: read("--muted-foreground", "hsl(0 0% 40%)"),
    grid: read("--border", "hsl(0 0% 90%)"),
    palette: PALETTE_FALLBACKS.map((fb, i) => read(`--chart-${i + 1}`, fb)),
  };
}

/**
 * Liest die Chart-Farben aus unseren CSS-Variablen und aktualisiert sie,
 * wenn zwischen Light/Dark gewechselt wird (Beobachtung der .dark-Klasse
 * auf <html>).
 */
export function useChartColors(): ChartColors {
  const [colors, setColors] = useState<ChartColors>(() => resolve());

  useEffect(() => {
    setColors(resolve());
    const observer = new MutationObserver(() => setColors(resolve()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return colors;
}
