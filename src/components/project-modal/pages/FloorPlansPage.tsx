'use client';

import { useState } from 'react';

import type { ProjectModalPageProps } from '../registry';
import { PAGE_PAD } from '../registry';

/* ───────────────────────────────────────────────────────────────────────────
   Floor plans — SCAFFOLD.

   A selector down the left and a single large plate on the right. There is no
   floor-plan asset field in Sanity yet, so the plate is an empty frame — this
   page is here to prove the switching, not the drawing.
   ─────────────────────────────────────────────────────────────────────────── */

export default function FloorPlansPage({ project }: ProjectModalPageProps) {
  // Floors come out of the unit schedule, in the order they were authored.
  const floors = Array.from(new Set((project.units ?? []).map((u) => u.floor)));
  const [active, setActive] = useState(0);

  return (
    <div
      className="grid min-h-full w-full grid-cols-1 gap-[3vw] lg:grid-cols-12"
      style={{ padding: PAGE_PAD }}
    >
      <div className="lg:col-span-3">
        <h2
          data-page-rise
          className="font-sans font-[300] leading-[0.95] tracking-[0.02em] text-paper"
          style={{ fontSize: 'clamp(28px, 2.6vw, 48px)' }}
        >
          Floor plans
        </h2>

        {floors.length > 0 ? (
          <ul data-page-rise className="mt-10 flex flex-wrap gap-x-8 gap-y-3 lg:block lg:space-y-3">
            {floors.map((floor, i) => {
              const on = i === active;
              return (
                <li key={floor}>
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    className="group inline-flex items-center gap-4 text-left"
                    aria-pressed={on}
                  >
                    <span
                      className="block h-px transition-all duration-300"
                      style={{
                        width: on ? 28 : 12,
                        background: on ? 'var(--color-threshold)' : 'rgba(255,255,255,0.25)',
                      }}
                    />
                    <span
                      className="text-body transition-colors duration-300"
                      style={{
                        color: on ? 'var(--color-paper)' : 'var(--color-stone)',
                        fontWeight: on ? 400 : 300,
                      }}
                    >
                      {floor}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p data-page-rise className="mt-10 max-w-[34ch] text-body text-stone">
            Drawings for this residence have not been released yet.
          </p>
        )}
      </div>

      {/* The plate. An empty frame until the plans land in the CMS. */}
      <div
        data-page-rise
        className="relative min-h-[46vh] border border-white/[0.08] lg:col-span-8 lg:col-start-5"
      >
        <div className="absolute inset-0 grid place-items-center">
          <span className="text-label tracking-[0.24em] text-stone">
            {floors[active] ? floors[active].toUpperCase() : 'DRAWING'}
          </span>
        </div>
      </div>
    </div>
  );
}
