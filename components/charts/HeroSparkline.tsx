"use client";

import { useId } from "react";

interface Props {
  values: number[];
}

/**
 * Weisse, ECKIGE Sparkline (miter joins) auf transparentem Grund – fuer das
 * Hero-Metrik-Panel gedacht (weiss auf Magenta). Reines SVG, keine Achsen.
 * Bewusst eckig (strokeLinejoin="miter") gemaess Design-Vorgabe.
 */
export function HeroSparkline({ values }: Props) {
  const gid = useId();
  if (!values || values.length < 2) return null;

  const W = 760;
  const H = 120;
  const padT = 14;
  const padB = 10;
  const max = Math.max(...values) * 1.12 || 1;
  const min = Math.min(...values) * 0.85;
  const span = max - min || 1;
  const ih = H - padT - padB;
  const x = (i: number) => (W * i) / (values.length - 1);
  const y = (v: number) => padT + ih - ((v - min) / span) * ih;
  const line = values
    .map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`)
    .join(" ");
  const area = `${line} L${W} ${H} L0 ${H} Z`;
  const last = values.length - 1;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      preserveAspectRatio="none"
      style={{ display: "block", overflow: "visible" }}
      role="img"
      aria-hidden
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity={0.3} />
          <stop offset="100%" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path
        d={line}
        fill="none"
        stroke="#fff"
        strokeWidth={2.5}
        strokeLinecap="butt"
        strokeLinejoin="miter"
      />
      <circle cx={x(last)} cy={y(values[last])} r={9} fill="#fff" opacity={0.25} />
      <circle cx={x(last)} cy={y(values[last])} r={4} fill="#fff" />
    </svg>
  );
}
