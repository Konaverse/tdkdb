'use client';

import type { ProjectUnit } from '@/lib/sanity/types';

import type { ProjectModalPageProps } from '../registry';
import { PAGE_PAD } from '../registry';

/* ───────────────────────────────────────────────────────────────────────────
   Availability — SCAFFOLD.

   The unit schedule as a drawing schedule: one hairline per row and nothing
   else. Designed properly in its own pass.
   ─────────────────────────────────────────────────────────────────────────── */

const statusLabel: Record<ProjectUnit['status'], string> = {
  available: 'Available',
  reserved: 'Reserved',
  sold: 'Sold',
};

const statusColor: Record<ProjectUnit['status'], string> = {
  available: 'var(--color-threshold)',
  reserved: 'var(--color-stone)',
  sold: 'rgba(140,140,140,0.45)',
};

export default function AvailabilityPage({ project }: ProjectModalPageProps) {
  const units = project.units ?? [];
  const available = units.filter((u) => u.status === 'available').length;

  return (
    <div className="min-h-full w-full" style={{ padding: PAGE_PAD }}>
      <div data-page-rise className="flex flex-wrap items-baseline justify-between gap-6">
        <h2
          className="font-sans font-[300] leading-[0.95] tracking-[0.02em] text-paper"
          style={{ fontSize: 'clamp(28px, 2.6vw, 48px)' }}
        >
          {project.unitsHeading ?? 'Availability'}
        </h2>
        {units.length > 0 && (
          <span className="font-mono text-mono text-stone">
            {available} of {units.length} available
          </span>
        )}
      </div>

      {units.length > 0 ? (
        <div data-page-rise className="mt-12">
          <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-x-6 pb-4 md:gap-x-12">
            {['Floor', 'Type', 'Size', 'Status'].map((h) => (
              <span key={h} className="text-label tracking-[0.22em] text-stone">
                {h.toUpperCase()}
              </span>
            ))}
          </div>

          {units.map((u, i) => (
            <div
              key={`${u.floor}-${u.unitType}-${i}`}
              className="grid grid-cols-[1fr_1fr_auto_auto] items-baseline gap-x-6 border-t border-white/[0.06] py-5 md:gap-x-12"
              style={{ opacity: u.status === 'sold' ? 0.45 : 1 }}
            >
              <span className="font-sans font-[300] text-paper">{u.floor}</span>
              <span className="font-sans font-[300] text-stone">{u.unitType}</span>
              <span className="whitespace-nowrap font-mono text-mono text-stone">
                {u.sizeM2} m²
              </span>
              <span
                className="whitespace-nowrap text-label tracking-[0.2em]"
                style={{ color: statusColor[u.status] }}
              >
                {statusLabel[u.status].toUpperCase()}
              </span>
            </div>
          ))}
          <span className="block h-px w-full bg-white/[0.06]" />
        </div>
      ) : (
        <p data-page-rise className="mt-12 max-w-[46ch] text-body text-stone">
          {project.unitsNote ?? 'The unit schedule for this residence is not yet released.'}
        </p>
      )}

      {units.length > 0 && project.unitsNote && (
        <p data-page-rise className="mt-8 max-w-[52ch] text-body text-stone">
          {project.unitsNote}
        </p>
      )}
    </div>
  );
}
