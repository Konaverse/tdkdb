'use client';

import { useLayoutEffect, useRef } from 'react';

import { gsap, gsapInit } from '@/lib/animations/gsap';
import { bedroomsLabel, floorLabel, UNIT_STATUS_LABEL } from '@/lib/projects/display';
import type { ProjectUnit } from '@/lib/sanity/types';

/* ───────────────────────────────────────────────────────────────────────────
   ProjectAvailability — what there is, at a glance

   The fast part of the page. A large "Availability" and three figures
   (residences, available now, the size range) answer the first questions
   before the table is read at all. The table is set like a price list, not a
   spreadsheet: no rules, rows banded in the faintest grey, numbers in mono,
   sold residences stepped back. Available ones carry the teal mark.

   MOTION — once, on arrival
   · The heading slides sideways into its mask (the site's side reveal).
   · The figures count up.
   · The rows rise in, a beat apart, top to bottom.
   ─────────────────────────────────────────────────────────────────────────── */

interface ProjectAvailabilityProps {
  units: ProjectUnit[];
  note?: string;
}

const INK = '#111111';
const MUTED = 'rgba(17, 17, 17, 0.5)';
const BAND = '#f5f5f2';
const TEAL = 'var(--color-threshold, #66979f)';

export default function ProjectAvailability({ units, note }: ProjectAvailabilityProps) {
  const rootRef = useRef<HTMLElement>(null);

  const available = units.filter((u) => u.status === 'available').length;
  const sizes = units.map((u) => u.sizeM2).filter((n) => Number.isFinite(n));
  const minSize = Math.min(...sizes);
  const maxSize = Math.max(...sizes);
  const showFloor = units.some((u) => floorLabel(u));

  const figures: { value: number; to?: number; unit?: string; label: string }[] = [
    { value: units.length, label: units.length === 1 ? 'Residence' : 'Residences' },
    { value: available, label: available === 0 ? 'Sold out' : 'Available now' },
    ...(sizes.length
      ? [
          {
            value: minSize,
            to: maxSize !== minSize ? maxSize : undefined,
            unit: 'm²',
            label: 'Interior area',
          },
        ]
      : []),
  ];

  useLayoutEffect(() => {
    gsapInit();
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(root);
      const counters = q('[data-count]') as HTMLElement[];
      const rows = q('[data-row]');

      gsap.set(q('[data-heading]'), { xPercent: -104, x: 0 });
      gsap.set(q('[data-figure]'), { autoAlpha: 0, y: 18 });
      gsap.set(rows, { autoAlpha: 0, y: 22 });
      counters.forEach((el) => (el.textContent = '0'));

      const tl = gsap.timeline({
        scrollTrigger: { trigger: root, start: 'top 85%', once: true },
      });
      tl.to(q('[data-heading]'), { xPercent: 0, x: 0, duration: 1.3, ease: 'power4.out' }, 0);
      tl.to(
        q('[data-figure]'),
        { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1 },
        0.25,
      );
      counters.forEach((el, i) => {
        const target = Number(el.dataset.count);
        const n = { v: 0 };
        tl.to(
          n,
          {
            v: target,
            duration: 1.4,
            ease: 'power2.out',
            onUpdate: () => {
              el.textContent = String(Math.round(n.v));
            },
          },
          0.3 + i * 0.08,
        );
      });
      tl.to(rows, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.06 }, 0.55);
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      data-nav="light"
      aria-labelledby="availability-heading"
      className="px-page relative pb-[16svh] pt-[18svh]"
      style={{ background: '#ffffff', color: INK, fontFamily: 'var(--font-josefin)' }}
    >
      <div className="flex flex-col gap-14 lg:flex-row lg:items-end lg:justify-between">
        <h2
          id="availability-heading"
          className="-mb-[0.1em] -mt-[0.18em] overflow-hidden pb-[0.1em] pt-[0.18em] text-[clamp(52px,7.4vw,140px)] font-[300] leading-[0.9] tracking-[-0.01em]"
        >
          <span data-heading className="block">
            Availability
          </span>
        </h2>

        <dl className="grid grid-cols-3 gap-x-[clamp(20px,4vw,80px)] lg:mb-[0.6vw]">
          {figures.map((f) => (
            <div key={f.label} data-figure className="flex flex-col-reverse">
              <dt className="mt-3 text-[clamp(13px,0.95vw,16px)]" style={{ color: MUTED }}>
                {f.label}
              </dt>
              <dd className="whitespace-nowrap font-mono text-[clamp(30px,3.2vw,60px)] leading-none tracking-[-0.04em]">
                <span data-count={f.value}>{f.value}</span>
                {f.to !== undefined && (
                  <>
                    –<span data-count={f.to}>{f.to}</span>
                  </>
                )}
                {f.unit && (
                  <span className="ml-1 font-sans text-[0.42em] font-[300] tracking-normal">
                    {f.unit}
                  </span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <table className="mt-[12svh] w-full border-separate border-spacing-0 text-left">
        <thead>
          <tr className="text-[clamp(13px,0.95vw,15px)]" style={{ color: MUTED }}>
            <th scope="col" className="px-2.5 pb-5 font-[400] sm:px-4 lg:px-6">
              Residence
            </th>
            {showFloor && (
              <th
                scope="col"
                className="hidden px-2.5 pb-5 font-[400] sm:px-4 md:table-cell lg:px-6"
              >
                Floor
              </th>
            )}
            <th scope="col" className="px-2.5 pb-5 font-[400] sm:px-4 lg:px-6">
              Bedrooms
            </th>
            <th scope="col" className="px-2.5 pb-5 font-[400] sm:px-4 lg:px-6">
              Area
            </th>
            <th scope="col" className="px-2.5 pb-5 text-right font-[400] sm:px-4 lg:px-6">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {units.map((u, i) => {
            const sold = u.status !== 'available';
            return (
              <tr
                key={`${u.floor}-${i}`}
                data-row
                className="text-[clamp(15px,1.15vw,20px)] font-[300]"
                style={{ background: i % 2 === 0 ? BAND : 'transparent' }}
              >
                <td
                  className="px-2.5 py-[clamp(16px,2svh,24px)] font-mono text-[0.9em] sm:px-4 lg:px-6"
                  style={{ opacity: sold ? 0.45 : 1 }}
                >
                  {u.floor}
                </td>
                {showFloor && (
                  <td
                    className="hidden px-2.5 sm:px-4 md:table-cell lg:px-6"
                    style={{ opacity: sold ? 0.45 : 1 }}
                  >
                    {floorLabel(u) ?? ''}
                  </td>
                )}
                <td
                  className="whitespace-nowrap px-2.5 sm:px-4 lg:px-6"
                  style={{ opacity: sold ? 0.45 : 1 }}
                >
                  <span className="sm:hidden">{bedroomsLabel(u.unitType, true)}</span>
                  <span className="hidden sm:inline">{bedroomsLabel(u.unitType)}</span>
                </td>
                <td
                  className="whitespace-nowrap px-2.5 font-mono text-[0.9em] sm:px-4 lg:px-6"
                  style={{ opacity: sold ? 0.45 : 1 }}
                >
                  {u.sizeM2}
                  <span className="ml-1 font-sans">m²</span>
                </td>
                <td className="px-2.5 text-right sm:px-4 lg:px-6">
                  <span
                    className="inline-flex items-center gap-3"
                    style={{ color: sold ? MUTED : INK }}
                  >
                    {!sold && (
                      <span
                        aria-hidden="true"
                        className="block h-2 w-2"
                        style={{ background: TEAL }}
                      />
                    )}
                    {UNIT_STATUS_LABEL[u.status]}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {note && (
        <p
          className="mt-8 px-2.5 text-[clamp(14px,1vw,17px)] sm:px-4 lg:px-6"
          style={{ color: MUTED }}
        >
          {note}
        </p>
      )}
    </section>
  );
}
