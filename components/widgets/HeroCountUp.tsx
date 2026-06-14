"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  /** Zielwert fuer den Count-up. null = statischer Wert (kein Count-up). */
  to: number | null;
  /** Fertig formatierter Anzeigewert (Fallback / nicht-numerische Metriken). */
  value: string;
  suffix?: string;
}

/**
 * Count-up-Island fuer das Hero-Panel. Basiszustand = Zielwert, damit SSR,
 * reduzierte Bewegung und statische Frames sofort die echte Zahl zeigen –
 * die rAF-Animation ist reine Progressive Enhancement.
 */
export function HeroCountUp({ to, value, suffix = "" }: Props) {
  const [shown, setShown] = useState<number>(to ?? 0);
  const started = useRef(false);

  useEffect(() => {
    if (to == null || started.current) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setShown(to);
      return;
    }
    started.current = true;
    let raf = 0;
    let t0: number | undefined;
    const dur = 1100;
    const tick = (t: number) => {
      if (t0 === undefined) t0 = t;
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(to * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);

  if (to == null) return <>{value}</>;
  return (
    <>
      {Math.round(shown).toLocaleString("de-DE")}
      {suffix}
    </>
  );
}
