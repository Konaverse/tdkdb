'use client';

import type { ProjectModalPageProps } from '../registry';
import { PAGE_PAD } from '../registry';

/* ───────────────────────────────────────────────────────────────────────────
   Characteristics — SCAFFOLD.

   The spec sheet. Two independent columns rather than one long list, so the
   page reads as a drawing schedule instead of a settings screen. Real
   composition comes in its own pass.
   ─────────────────────────────────────────────────────────────────────────── */

export default function CharacteristicsPage({ project }: ProjectModalPageProps) {
  const specs = project.specs ?? [];
  const features = project.features ?? [];

  // Split down the middle so both columns fill; an odd count leaves the
  // longer half on the left, which is where the eye starts.
  const half = Math.ceil(specs.length / 2);
  const columns = [specs.slice(0, half), specs.slice(half)];

  return (
    <div className="min-h-full w-full" style={{ padding: PAGE_PAD }}>
      <h2
        data-page-rise
        className="font-sans font-[300] leading-[0.95] tracking-[0.02em] text-paper"
        style={{ fontSize: 'clamp(28px, 2.6vw, 48px)' }}
      >
        Characteristics
      </h2>

      {specs.length > 0 ? (
        <div data-page-rise className="mt-12 grid grid-cols-1 gap-x-[6vw] md:grid-cols-2">
          {columns.map((col, i) => (
            <dl key={i}>
              {col.map((s) => (
                <div
                  key={s.key}
                  className="flex items-baseline justify-between gap-6 border-b border-white/[0.06] py-5"
                >
                  <dt className="text-label tracking-[0.22em] text-stone">{s.key.toUpperCase()}</dt>
                  <dd className="text-right font-sans font-[300] text-paper">{s.value}</dd>
                </div>
              ))}
            </dl>
          ))}
        </div>
      ) : (
        <p data-page-rise className="mt-12 max-w-[46ch] text-body text-stone">
          Specifications for this residence have not been published yet.
        </p>
      )}

      {features.length > 0 && (
        <ul data-page-rise className="mt-16 grid grid-cols-1 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-4 pr-6">
              <span className="mt-[0.7em] block h-px w-5 shrink-0 bg-threshold" />
              <span className="text-body text-stone">{f}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
