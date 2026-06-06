"use client";

import { useEffect, useState } from "react";

export interface ChartColors {
  accent: string;
  compare: string;
  axis: string;
  grid: string;
}

function read(varName: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
  return raw ? `hsl(${raw})` : fallback;
}

function resolve(): ChartColors {
  return {
    accent: read("--accent", "hsl(329 100% 44%)"),
    compare: read("--muted-foreground", "hsl(0 0% 40%)"),
    axis: read("--muted-foreground", "hsl(0 0% 40%)"),
    grid: read("--border", "hsl(0 0% 90%)"),
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
