'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, TouchEvent as ReactTouchEvent } from 'react';
import { createPortal } from 'react-dom';

import { gsap, gsapInit } from '@/lib/animations/gsap';
import { getLenis } from '@/lib/animations/lenis';
import type { Project } from '@/lib/sanity/types';

import { MODAL_PAGES, PAGE_PAD } from './registry';

/* ───────────────────────────────────────────────────────────────────────────
   ProjectModal — the brochure.

   A portal-mounted sheet with margins all round. Above it sits the close
   button; flanking it, in the side margins, the two page arrows. Along the
   bottom of the sheet itself runs the nav bar, six leaves, with a rule that
   travels from the outgoing label to the incoming one.

   THE SHELL ONLY. Every page under `pages/` is a structural scaffold — each
   one gets its own composition pass. What is finished here is the machinery:
   mounting, scroll handover, page transitions, the travelling rule, arrow
   bounds, keyboard and swipe.

   Three things worth knowing before touching this:

   · Page nodes are keyed by page id and rendered as a two-slot stack
     (`[from, current]`). Keying by id rather than by slot is what lets the
     outgoing node survive reconciliation, so a page interrupted mid-entrance
     exits from wherever it actually was instead of snapping to rest first.

   · Scroll is handed to the sheet, not taken from the page. Lenis is stopped
     rather than `overflow: hidden` on the body — hiding body overflow
     collapses the document height and the browser clamps scrollTop to 0,
     which would silently throw away the reel's pinned position. The scrollers
     inside carry `data-lenis-prevent` so Lenis lets their wheel events
     through while it is stopped.

   · Nav labels reserve their bold width with an invisible twin. Without it,
     the active label widens on selection, every label to its right shifts,
     and the rule chases a target that moved after it was measured.

   Layering discipline, same as the reel: one animated transform per node.
   The sheet owns `y`/`scale` (open + close), each page slot owns `x`, the
   rise children own `y`, and the rule owns `x`. Nothing carries two.
   ─────────────────────────────────────────────────────────────────────────── */

interface ProjectModalProps {
  /** Non-null opens the modal. The parent nulls it from `onClose`. */
  project: Project | null;
  onClose: () => void;
  /** Leaf to open on. Defaults to Overview. */
  initialPage?: number;
}

const LAST = MODAL_PAGES.length - 1;

/** Height of the nav bar along the bottom of the sheet. */
const NAV_H = 'clamp(56px, 6.4vh, 74px)';

export default function ProjectModal({ project, onClose, initialPage = 0 }: ProjectModalProps) {
  // Portals need a DOM to aim at, so nothing renders on the server pass.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || !project) return null;

  return createPortal(
    // Keyed by project: a different project is a different brochure, opened
    // fresh at Overview rather than wherever the last one was left.
    <ModalShell key={project._id} project={project} onClose={onClose} initialPage={initialPage} />,
    document.body,
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */

interface ShellProps {
  project: Project;
  onClose: () => void;
  initialPage: number;
}

interface View {
  /** Index of the leaf on screen. Deliberately not named `current` — the
      react-hooks lint rule reads any `x.current` as a mutable ref and refuses
      to accept it as a dependency. */
  page: number;
  /** Page leaving, or -1 when settled. */
  from: number;
  dir: 1 | -1;
  /** Bumped per navigation so the transition effect re-fires. */
  nonce: number;
}

function ModalShell({ project, onClose, initialPage }: ShellProps) {
  const [view, setView] = useState<View>({
    page: gsap.utils.clamp(0, LAST, initialPage),
    from: -1,
    dir: 1,
    nonce: 0,
  });

  const overlayRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const navTrackRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const ruleRef = useRef<HTMLSpanElement>(null);

  const reducedRef = useRef(false);
  const closingRef = useRef(false);
  /** False until the rule has been placed once — the first placement is a set. */
  const ruledRef = useRef(false);
  /** Latest index, for listeners that must not re-bind on every navigation. */
  const pageRef = useRef(view.page);
  pageRef.current = view.page;

  // ── Navigation ────────────────────────────────────────────────────────────
  // Takes an index or a stepper, so the arrows, the nav bar, the keyboard and
  // the swipe handler all go through one clamped path.
  const goTo = useCallback((resolve: number | ((cur: number) => number)) => {
    setView((v) => {
      const raw = typeof resolve === 'function' ? resolve(v.page) : resolve;
      const next = Math.max(0, Math.min(LAST, raw));
      if (next === v.page) return v;
      return { page: next, from: v.page, dir: next > v.page ? 1 : -1, nonce: v.nonce + 1 };
    });
  }, []);

  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;

    if (reducedRef.current) {
      onClose();
      return;
    }

    // The open timeline may still be running on these two nodes.
    gsap.killTweensOf([sheetRef.current, scrimRef.current]);

    gsap
      .timeline({ defaults: { ease: 'power2.in' }, onComplete: onClose })
      .to(sheetRef.current, { autoAlpha: 0, y: 20, scale: 0.99, duration: 0.3 }, 0)
      .to('[data-modal-chrome]', { autoAlpha: 0, duration: 0.22 }, 0)
      .to(scrimRef.current, { autoAlpha: 0, duration: 0.34 }, 0.04);
  }, [onClose]);

  // ── Scroll handover ───────────────────────────────────────────────────────
  useEffect(() => {
    const lenis = getLenis();
    lenis?.stop();
    return () => {
      lenis?.start();
    };
  }, []);

  // ── Open ──────────────────────────────────────────────────────────────────
  useLayoutEffect(() => {
    gsapInit();
    reducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      const rise = slotRefs.current[pageRef.current]?.querySelectorAll('[data-page-rise]');

      if (reducedRef.current) {
        gsap.set([sheetRef.current, scrimRef.current, '[data-modal-chrome-open]'], {
          autoAlpha: 1,
        });
        if (rise?.length) gsap.set(rise, { autoAlpha: 1, y: 0 });
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        scrimRef.current,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.42, ease: 'power2.out' },
        0,
      )
        .fromTo(
          sheetRef.current,
          { autoAlpha: 0, y: 34, scale: 0.985 },
          { autoAlpha: 1, y: 0, scale: 1, duration: 0.72 },
          0.05,
        )
        // Only the close button. The arrows come and go with the page bounds,
        // so they fade themselves in on mount instead — sweeping them here as
        // well would give the one that is already on screen two owners of the
        // same property.
        .fromTo(
          '[data-modal-chrome-open]',
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.4 },
          0.32,
        );

      if (rise?.length) {
        tl.fromTo(
          rise,
          { autoAlpha: 0, y: 24 },
          { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.06 },
          0.26,
        );
      }
    }, overlayRef);

    return () => ctx.revert();
  }, []);

  // ── Page transition ───────────────────────────────────────────────────────
  useLayoutEffect(() => {
    if (view.from < 0) return;

    const inEl = slotRefs.current[view.page];
    const outEl = slotRefs.current[view.from];
    const dir = view.dir;

    // Dropping `from` unmounts the outgoing slot. Guarded so a navigation that
    // lands mid-flight is not settled by the timeline it interrupted.
    const settle = () =>
      setView((v) => (v.nonce === view.nonce && v.from >= 0 ? { ...v, from: -1 } : v));

    if (reducedRef.current || !inEl) {
      settle();
      return;
    }

    gsap.killTweensOf([inEl, outEl].filter(Boolean) as HTMLElement[]);
    const rise = inEl.querySelectorAll('[data-page-rise]');

    const tl = gsap.timeline({ onComplete: settle });

    if (outEl) {
      tl.to(outEl, { autoAlpha: 0, x: -dir * 44, duration: 0.34, ease: 'power2.in' }, 0);
    }
    tl.fromTo(
      inEl,
      { autoAlpha: 0, x: dir * 60 },
      { autoAlpha: 1, x: 0, duration: 0.58, ease: 'power3.out' },
      0.1,
    );
    if (rise.length) {
      tl.fromTo(
        rise,
        { autoAlpha: 0, y: 22 },
        { autoAlpha: 1, y: 0, duration: 0.52, stagger: 0.055, ease: 'power3.out' },
        0.2,
      );
    }

    return () => {
      tl.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.nonce]);

  // ── The travelling rule ───────────────────────────────────────────────────
  const placeRule = useCallback((index: number, animate: boolean) => {
    const item = itemRefs.current[index];
    const rule = ruleRef.current;
    const track = navTrackRef.current;
    if (!item || !rule) return;

    // `offsetLeft` is measured against the track, which is the offset parent —
    // so this stays correct while the track is scrolled sideways on narrow
    // viewports, because the rule scrolls with it.
    const x = item.offsetLeft;
    const w = item.offsetWidth;

    if (animate && !reducedRef.current) {
      gsap.to(rule, { x, width: w, autoAlpha: 1, duration: 0.55, ease: 'power3.inOut' });
    } else {
      gsap.set(rule, { x, width: w, autoAlpha: 1 });
    }

    // Keep the active label reachable when the row overflows. Set directly
    // rather than `scrollIntoView`, which is free to scroll ancestors too.
    if (track && track.scrollWidth > track.clientWidth) {
      track.scrollLeft = x - (track.clientWidth - w) / 2;
    }
  }, []);

  useLayoutEffect(() => {
    placeRule(view.page, ruledRef.current);
    ruledRef.current = true;
  }, [view.page, placeRule]);

  // Re-measure on resize and once the real face has swapped in — the rule is
  // measured off rendered glyphs, so it is wrong until then.
  useEffect(() => {
    const remeasure = () => placeRule(pageRef.current, false);
    window.addEventListener('resize', remeasure);
    let live = true;
    document.fonts?.ready.then(() => {
      if (live) remeasure();
    });
    return () => {
      live = false;
      window.removeEventListener('resize', remeasure);
    };
  }, [placeRule]);

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        requestClose();
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goTo((c) => c + 1);
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goTo((c) => c - 1);
        return;
      }
      if (e.key !== 'Tab') return;

      // Focus trap. Re-queried per keystroke because the arrows come and go
      // with the page bounds, so a cached list goes stale immediately.
      const root = overlayRef.current;
      if (!root) return;
      const focusable = Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null);
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey && (active === first || !root.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [goTo, requestClose]);

  // ── Focus ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    sheetRef.current?.focus({ preventScroll: true });
    return () => previous?.focus?.({ preventScroll: true });
  }, []);

  // ── Swipe — the only way through the leaves on touch ──────────────────────
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: ReactTouchEvent) => {
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: ReactTouchEvent) => {
    const start = touch.current;
    touch.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    // Vertical intent wins — these pages scroll.
    if (Math.abs(dx) < 64 || Math.abs(dx) < Math.abs(dy) * 1.6) return;
    goTo((c) => c + (dx < 0 ? 1 : -1));
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const hasPrev = view.page > 0;
  const hasNext = view.page < LAST;
  const slots = view.from >= 0 ? [view.from, view.page] : [view.page];

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${project.title} — project brochure`}
      className="fixed inset-0 z-[400]"
      style={
        {
          // Margins all round. The top band is deeper than the rest: it is
          // what the close button sits in.
          '--mx': 'clamp(16px, 4.6vw, 96px)',
          '--mt': 'clamp(58px, 8vh, 96px)',
          '--mb': 'clamp(16px, 3.6vh, 46px)',
        } as CSSProperties
      }
    >
      {/* Scrim. Clicking the margin closes — the sheet stops the click.

          The colour is written out rather than `bg-void/[0.92]`. Every palette
          token resolves to a bare `var(--color-…)` with no `<alpha-value>`
          slot, so Tailwind's opacity modifier compiles to an invalid colour
          and the element comes out fully transparent — silently. Same reason
          the hover borders below are `border-white/…` and not `border-paper/…`. */}
      <div
        ref={scrimRef}
        onClick={requestClose}
        className="absolute inset-0 backdrop-blur-[6px]"
        style={{ opacity: 0, background: 'rgba(13, 13, 13, 0.92)' }}
      />

      {/* ── Close — above the sheet, in the top band ─────────────────────── */}
      <button
        type="button"
        data-modal-chrome
        data-modal-chrome-open
        onClick={requestClose}
        aria-label="Close"
        className="group absolute z-30 grid h-11 w-11 place-items-center"
        style={{ top: 'calc(var(--mt) / 2)', right: 'var(--mx)', transform: 'translateY(-50%)' }}
      >
        <span className="absolute inset-0 rounded-full border border-white/15 transition-colors duration-300 group-hover:border-white/50" />
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.15"
          className="h-[13px] w-[13px] text-stone transition-colors duration-300 group-hover:text-paper"
        >
          <path d="M2 2l12 12M14 2L2 14" />
        </svg>
      </button>

      {/* ── Arrows — in the side margins, desktop only ───────────────────── */}
      {hasPrev && (
        <ArrowButton side="left" label="Previous page" onClick={() => goTo((c) => c - 1)} />
      )}
      {hasNext && <ArrowButton side="right" label="Next page" onClick={() => goTo((c) => c + 1)} />}

      {/* ── The sheet ────────────────────────────────────────────────────── */}
      <div
        ref={sheetRef}
        tabIndex={-1}
        className="absolute flex flex-col overflow-hidden border border-white/[0.09] bg-[#101010] outline-none will-change-transform"
        style={{
          top: 'var(--mt)',
          right: 'var(--mx)',
          bottom: 'var(--mb)',
          left: 'var(--mx)',
          opacity: 0,
        }}
      >
        {/* Page stack. Two slots at most — the leaving page and the arriving
            one — keyed by page id so the leaving node survives. */}
        <div
          ref={stackRef}
          className="relative min-h-0 flex-1"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {slots.map((idx) => {
            const { id, Component } = MODAL_PAGES[idx];
            const isCurrent = idx === view.page;
            return (
              <div
                key={id}
                ref={(el) => {
                  slotRefs.current[idx] = el;
                }}
                data-lenis-prevent
                aria-hidden={!isCurrent}
                className="absolute inset-0 overflow-y-auto overflow-x-hidden will-change-transform"
                style={{ zIndex: isCurrent ? 2 : 1 }}
              >
                <Component project={project} />
              </div>
            );
          })}
        </div>

        {/* ── Nav bar ───────────────────────────────────────────────────── */}
        <nav
          aria-label="Brochure pages"
          className="relative z-10 flex shrink-0 items-stretch border-t border-white/[0.08]"
          style={{ height: NAV_H }}
        >
          <div
            ref={navTrackRef}
            data-lenis-prevent
            className="relative flex min-w-0 flex-1 items-center gap-[clamp(20px,2.6vw,46px)] overflow-x-auto"
            style={{ paddingLeft: PAGE_PAD, paddingRight: PAGE_PAD, scrollbarWidth: 'none' }}
          >
            {MODAL_PAGES.map((page, i) => {
              const on = i === view.page;
              return (
                <button
                  key={page.id}
                  ref={(el) => {
                    itemRefs.current[i] = el;
                  }}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-current={on ? 'page' : undefined}
                  className="relative grid shrink-0 whitespace-nowrap"
                >
                  {/* Invisible twin, always bold — it fixes the cell width, so
                      selecting a label does not shove the row sideways under
                      a rule that was measured against the old layout. */}
                  <span
                    aria-hidden="true"
                    className="invisible col-start-1 row-start-1 text-label font-[500] tracking-[0.18em]"
                  >
                    {page.label.toUpperCase()}
                  </span>
                  <span
                    className="col-start-1 row-start-1 text-label tracking-[0.18em] transition-colors duration-300"
                    style={{
                      color: on ? 'var(--color-paper)' : 'var(--color-stone)',
                      fontWeight: on ? 500 : 300,
                    }}
                  >
                    {page.label.toUpperCase()}
                  </span>
                </button>
              );
            })}

            {/* The rule. One element for six labels — it travels rather than
                fading between fixed underlines. */}
            <span
              ref={ruleRef}
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0 left-0 block h-[2px] bg-threshold will-change-transform"
              style={{ width: 0, opacity: 0, visibility: 'hidden' }}
            />
          </div>

          {/* Touch/narrow paging. The side arrows need margin to live in and
              there is none below lg, so the pair moves into the bar. */}
          <div className="flex shrink-0 items-stretch border-l border-white/[0.08] lg:hidden">
            <NavStep dir={-1} disabled={!hasPrev} onClick={() => goTo((c) => c - 1)} />
            <span className="block w-px bg-white/[0.08]" />
            <NavStep dir={1} disabled={!hasNext} onClick={() => goTo((c) => c + 1)} />
          </div>
        </nav>
      </div>
    </div>
  );
}

/* ── Side-margin arrow ─────────────────────────────────────────────────────
   Centred in its margin band. Hidden below lg, where the band is too narrow
   to hold anything and the nav bar takes over paging.
   ───────────────────────────────────────────────────────────────────────── */

function ArrowButton({
  side,
  label,
  onClick,
}: {
  side: 'left' | 'right';
  label: string;
  onClick: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  // An arrow that appears mid-brochure (the left one, on leaving Overview) is
  // not in the open timeline's chrome sweep, so it fades itself in on mount.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const tween = gsap.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, delay: 0.12 });
    return () => {
      tween.kill();
    };
  }, []);

  return (
    <button
      ref={ref}
      type="button"
      data-modal-chrome
      onClick={onClick}
      aria-label={label}
      className="group absolute top-1/2 z-30 hidden h-12 place-items-center lg:grid"
      style={{
        left: side === 'left' ? 0 : undefined,
        right: side === 'right' ? 0 : undefined,
        width: 'var(--mx)',
        transform: 'translateY(-50%)',
      }}
    >
      <span className="absolute left-1/2 top-1/2 h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15 transition-colors duration-300 group-hover:border-white/50" />
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.15"
        className="relative h-4 w-4 text-stone transition-colors duration-300 group-hover:text-paper"
        style={{ transform: side === 'left' ? 'scaleX(-1)' : undefined }}
      >
        <path d="M1 8h13M9 3l5 5-5 5" />
      </svg>
    </button>
  );
}

/* ── In-bar step, below lg ─────────────────────────────────────────────── */

function NavStep({
  dir,
  disabled,
  onClick,
}: {
  dir: 1 | -1;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === 1 ? 'Next page' : 'Previous page'}
      className="grid w-14 place-items-center transition-opacity duration-300 disabled:pointer-events-none"
      style={{ opacity: disabled ? 0.2 : 1 }}
    >
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.15"
        className="h-4 w-4 text-paper"
        style={{ transform: dir === -1 ? 'scaleX(-1)' : undefined }}
      >
        <path d="M1 8h13M9 3l5 5-5 5" />
      </svg>
    </button>
  );
}
