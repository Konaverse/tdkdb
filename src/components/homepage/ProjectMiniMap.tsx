'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';

import { gsap, gsapInit } from '@/lib/animations/gsap';

/* ───────────────────────────────────────────────────────────────────────────
   ProjectMiniMap — the bottom-right cell of a project sheet.

   An abstract site plan, not a map: a street grid rotated off-axis, a couple
   of arterials, one sweeping road that breaks the regularity, and a surveyor's
   marker on an intersection. No labels, no buildings, no detail — at this size
   detail reads as noise. The point is "this is a real place, here".

   The whole plan is generated deterministically from `seed` (the project slug)
   so server and client render byte-identical markup — never Math.random() at
   render time. Two projects therefore get two distinct street patterns for
   free, and the pattern is stable across deploys.

   When real road geometry arrives (traced off a screenshot, or from a tile
   provider), pass it in as `roads` and the generator steps aside.

   Animation is driven from outside: the reel targets
     [data-map-road]   — every street, drawn in via stroke-dashoffset
     [data-map-pin]     — the marker group, dropped in
     [data-map-guide-x] / [data-map-guide-y] — the survey guides, extended out
     [data-map-chrome]  — the HTML overlays (label, north point)
   The marker's pulse is the one thing it owns itself: it loops forever and
   must not be on a node the reel also touches.
   ─────────────────────────────────────────────────────────────────────────── */

const VB_W = 480;
const VB_H = 320;
const CX = VB_W / 2;
const CY = VB_H / 2;

const MINOR = 'rgba(245,240,232,0.115)';
const MAJOR = 'rgba(245,240,232,0.26)';
const SWEEP = 'rgba(245,240,232,0.2)';
const BLOCK = 'rgba(245,240,232,0.045)';
const ACCENT = 'var(--color-threshold)';

interface ProjectMiniMapProps {
  /** Stable string — the project slug. Same seed ⇒ same plan, forever. */
  seed: string;
  /** Shown bottom-left, under a hairline. Usually the project's location. */
  label: string;
  /** Hand-authored road paths. When present the generated grid is skipped. */
  roads?: { d: string; major?: boolean }[];
}

/* ── Deterministic noise ──────────────────────────────────────────────────── */

function fnv1a(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Street {
  v: number;
  major: boolean;
}

/* ── Plan generation ──────────────────────────────────────────────────────── */

function buildPlan(seed: string) {
  const rnd = mulberry32(fnv1a(seed));

  // Off-axis by 9–22°, and never near zero. A grid square to the frame reads
  // as a table; a grid at an angle reads as a place that existed before the
  // frame did. Leaving the sign to chance but not the magnitude is what stops
  // an unlucky seed from producing a spreadsheet.
  const angle = (rnd() < 0.5 ? -1 : 1) * (9 + rnd() * 13);
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  /** Rotate a point of the street grid into frame coordinates. */
  const rot = (x: number, y: number): [number, number] => [
    CX + (x - CX) * cos - (y - CY) * sin,
    CY + (x - CX) * sin + (y - CY) * cos,
  ];

  // Generated well outside the frame: after rotation the frame's corners sit
  // up to ~290 units from centre, so the grid has to overshoot or it shows its
  // own edges. Spacing is deliberately tight — the cell is cropped by `slice`
  // to roughly the middle band of the viewBox, and at wider spacings only three
  // or four streets survive the crop, which reads as a table rather than a town.
  const xs: Street[] = [];
  for (let x = -80; x < 570; x += 20 + rnd() * 26) xs.push({ v: x, major: false });
  const ys: Street[] = [];
  for (let y = -160; y < 490; y += 19 + rnd() * 25) ys.push({ v: y, major: false });

  // Arterials every 3rd–5th street rather than at random: real networks space
  // their through-roads out, and a random 20% clumps two of them side by side
  // as often as not.
  const promote = (streets: Street[]) => {
    for (let i = 1 + Math.floor(rnd() * 4); i < streets.length; i += 4 + Math.floor(rnd() * 4)) {
      streets[i].major = true;
    }
  };
  promote(xs);
  promote(ys);

  // Filled blocks, so the grid has some mass in it.
  const blocks: { x: number; y: number; w: number; h: number }[] = [];
  for (let n = 0; n < 9; n++) {
    const i = 1 + Math.floor(rnd() * (xs.length - 2));
    const j = 1 + Math.floor(rnd() * (ys.length - 2));
    blocks.push({
      x: xs[i].v,
      y: ys[j].v,
      w: xs[i + 1].v - xs[i].v,
      h: ys[j + 1].v - ys[j].v,
    });
  }

  // One sweeping road in frame space, cutting across the grid at its own will.
  const sweep = `M -40 ${40 + rnd() * 70} Q ${120 + rnd() * 90} ${200 + rnd() * 90} ${VB_W + 40} ${
    90 + rnd() * 120
  }`;

  // The marker sits on an intersection, preferring two arterials — a corner a
  // taxi driver could actually find. The preference is a weight on the distance
  // score, not a filter: arterial junctions are ~120 units apart, so filtering
  // on them first would happily accept one at the very edge of the frame over a
  // minor corner dead on target.
  //
  // The keep-out margin is generous because the cell crops the viewBox
  // (`preserveAspectRatio: slice`) by an amount that depends on its aspect. The
  // central band below survives every aspect the 8 × 8 grid can produce.
  const target: [number, number] = [CX * 0.94, CY];
  let pin: [number, number] = [CX, CY];
  let best = Infinity;
  for (const sx of xs) {
    for (const sy of ys) {
      const [px, py] = rot(sx.v, sy.v);
      if (px < 130 || px > VB_W - 130 || py < 110 || py > VB_H - 110) continue;
      const weight = sx.major && sy.major ? 0.55 : sx.major || sy.major ? 0.8 : 1;
      const d = Math.hypot(px - target[0], py - target[1]) * weight;
      if (d < best) {
        best = d;
        pin = [px, py];
      }
    }
  }

  return { angle, xs, ys, blocks, sweep, pin };
}

/* ── Component ────────────────────────────────────────────────────────────── */

export default function ProjectMiniMap({ seed, label, roads }: ProjectMiniMapProps) {
  const plan = useMemo(() => buildPlan(seed), [seed]);
  const pulseRef = useRef<SVGCircleElement>(null);

  const [px, py] = plan.pin;

  // The marker's own heartbeat. Deliberately not on any node the reel drives —
  // an infinite tween and a scrubbed timeline sharing a property is the exact
  // collision that kills both. `r` is an attribute, so no transform cache is
  // involved at all.
  useLayoutEffect(() => {
    gsapInit();
    const el = pulseRef.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const tw = gsap.fromTo(
      el,
      { attr: { r: 7 }, opacity: 0.5 },
      {
        attr: { r: 30 },
        opacity: 0,
        duration: 2.8,
        ease: 'power2.out',
        repeat: -1,
        repeatDelay: 0.7,
      },
    );

    return () => {
      tw.kill();
    };
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
        aria-hidden="true"
      >
        {roads ? (
          <g fill="none" strokeLinecap="square">
            {roads.map((r, i) => (
              <path
                key={i}
                data-map-road
                d={r.d}
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={0}
                stroke={r.major ? MAJOR : MINOR}
                strokeWidth={r.major ? 2.2 : 0.7}
              />
            ))}
          </g>
        ) : (
          <g transform={`rotate(${plan.angle} ${CX} ${CY})`}>
            {plan.blocks.map((b, i) => (
              <rect key={`b${i}`} x={b.x} y={b.y} width={b.w} height={b.h} fill={BLOCK} />
            ))}

            {/* Streets are drawn minor-first so arterials sit on top of the
                capillaries at every junction, the way a plan is inked. */}
            <g fill="none" strokeLinecap="square">
              {plan.ys
                .filter((s) => !s.major)
                .map((s, i) => (
                  <line
                    key={`hm${i}`}
                    data-map-road
                    x1={-240}
                    y1={s.v}
                    x2={VB_W + 240}
                    y2={s.v}
                    pathLength={1}
                    strokeDasharray={1}
                    strokeDashoffset={0}
                    stroke={MINOR}
                    strokeWidth={0.7}
                  />
                ))}
              {plan.xs
                .filter((s) => !s.major)
                .map((s, i) => (
                  <line
                    key={`vm${i}`}
                    data-map-road
                    x1={s.v}
                    y1={-240}
                    x2={s.v}
                    y2={VB_H + 240}
                    pathLength={1}
                    strokeDasharray={1}
                    strokeDashoffset={0}
                    stroke={MINOR}
                    strokeWidth={0.7}
                  />
                ))}
              {plan.ys
                .filter((s) => s.major)
                .map((s, i) => (
                  <line
                    key={`hM${i}`}
                    data-map-road
                    x1={-240}
                    y1={s.v}
                    x2={VB_W + 240}
                    y2={s.v}
                    pathLength={1}
                    strokeDasharray={1}
                    strokeDashoffset={0}
                    stroke={MAJOR}
                    strokeWidth={2.2}
                  />
                ))}
              {plan.xs
                .filter((s) => s.major)
                .map((s, i) => (
                  <line
                    key={`vM${i}`}
                    data-map-road
                    x1={s.v}
                    y1={-240}
                    x2={s.v}
                    y2={VB_H + 240}
                    pathLength={1}
                    strokeDasharray={1}
                    strokeDashoffset={0}
                    stroke={MAJOR}
                    strokeWidth={2.2}
                  />
                ))}
            </g>
          </g>
        )}

        {!roads && (
          <path
            data-map-road
            d={plan.sweep}
            fill="none"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={0}
            stroke={SWEEP}
            strokeWidth={1.6}
          />
        )}

        {/* Survey guides — they run out of the marker to the frame's edges, so
            the eye is told where the point is before it finds the marker. The
            reel extends them by animating x2/y2 outward from the pin. */}
        <line
          data-map-guide-x
          data-gx2={VB_W + 40}
          x1={px}
          y1={py}
          x2={VB_W + 40}
          y2={py}
          stroke={ACCENT}
          strokeWidth={0.7}
          strokeDasharray="2 6"
          opacity={0.45}
        />
        <line
          data-map-guide-y
          data-gy2={VB_H + 40}
          x1={px}
          y1={py}
          x2={px}
          y2={VB_H + 40}
          stroke={ACCENT}
          strokeWidth={0.7}
          strokeDasharray="2 6"
          opacity={0.45}
        />

        {/* Marker. A ring and a plumb dot with four ticks — a surveyor's mark,
            not a map-app teardrop. */}
        <g data-map-pin fill="none" stroke={ACCENT}>
          <circle ref={pulseRef} cx={px} cy={py} r={7} strokeWidth={1} opacity={0} />
          <circle cx={px} cy={py} r={9.5} strokeWidth={1.4} />
          <circle cx={px} cy={py} r={2.6} fill={ACCENT} stroke="none" />
          <g strokeWidth={0.9} opacity={0.8}>
            <line x1={px} y1={py - 14} x2={px} y2={py - 19} />
            <line x1={px} y1={py + 14} x2={px} y2={py + 19} />
            <line x1={px - 14} y1={py} x2={px - 19} y2={py} />
            <line x1={px + 14} y1={py} x2={px + 19} y2={py} />
          </g>
        </g>
      </svg>

      {/* ── HTML chrome ──────────────────────────────────────────────────────
          Kept out of the SVG on purpose: `slice` crops the viewBox to fill the
          cell, and anything pinned to a viewBox corner would be the first thing
          cropped. These stay put at any cell aspect. */}
      <div data-map-chrome className="pointer-events-none absolute inset-0">
        {/* Floor for the label — mono type at 10px loses badly against a
            street crossing behind it. */}
        <div
          className="absolute inset-x-0 bottom-0 h-1/3"
          style={{ background: 'linear-gradient(to top, rgba(13,13,13,0.92), rgba(13,13,13,0))' }}
        />

        <div className="absolute bottom-3 left-3 right-3">
          <span className="mb-2 block h-px w-10 bg-white/25" />
          <span className="block font-mono text-[10px] uppercase leading-none tracking-[0.22em] text-stone">
            {label}
          </span>
        </div>

        {/* North point. Every site plan has one; its absence is conspicuous. */}
        <div className="absolute right-3 top-3 flex flex-col items-center gap-1">
          <svg viewBox="0 0 12 16" className="h-4 w-3" fill="none" aria-hidden="true">
            <path d="M6 1 L6 15" stroke="rgba(245,240,232,0.35)" strokeWidth="1" />
            <path d="M3 5 L6 1 L9 5" stroke="rgba(245,240,232,0.35)" strokeWidth="1" />
          </svg>
          <span className="font-mono text-[9px] leading-none tracking-[0.2em] text-stone">N</span>
        </div>
      </div>
    </div>
  );
}
