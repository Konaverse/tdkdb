'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

import { gsap } from '@/lib/animations/gsap';

/* ───────────────────────────────────────────────────────────────────────────
   CustomCursor — a dot, and a ring over anything clickable

   Rewritten Sept 2026: the old one was a 1px ring that vanished on white,
   sometimes never rendered, and hid the native cursor whether or not it was
   there. The rules now:

   · One solid 12px dot in `difference` blend: black on the white pages,
     white over the dark renders, always there. Over a link or button the dot
     shrinks and a 44px ring opens around it. Over a text field both hide and
     the native I-beam shows (see globals.css).
   · GSAP owns the whole transform (xPercent/yPercent −50 set here, x/y
     written on move) — the old inline translate(-50%,-50%) was overwritten
     by GSAP's first write, which is why the cursor sat off the pointer.
   · The native cursor is hidden ONLY while this one is on screen:
     `html.has-cursor` is set when the pointer is inside the window with a
     known position and cleared when it leaves, the tab hides, or the window
     loses focus. If this component ever fails, the native cursor is simply
     there. Nothing is hidden before the first pointer event.
   · The state under the pointer is re-read on scroll (the page moves under
     a still mouse), and on pointerdown the dot presses.
   · Not mounted in the Studio, and never on coarse pointers.
   ─────────────────────────────────────────────────────────────────────────── */

type State = 'default' | 'link' | 'text';

const DOT = 12;
const RING = 44;
const CLICKABLE = 'a, button, [role="button"], label, summary, [data-cursor="link"]';
const TEXTUAL = 'input, textarea, select, [contenteditable="true"]';

export default function CustomCursor() {
  const pathname = usePathname();
  const inStudio = pathname?.startsWith('/studio') ?? false;

  const rootRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (inStudio) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const root = rootRef.current;
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!root || !dot || !ring) return;

    const html = document.documentElement;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const D = reduced ? 0 : 0.25;

    gsap.set(root, { xPercent: -50, yPercent: -50, autoAlpha: 0 });
    gsap.set(dot, { scale: 1 });
    gsap.set(ring, { scale: 0 });

    const xTo = gsap.quickTo(root, 'x', { duration: reduced ? 0 : 0.2, ease: 'power3.out' });
    const yTo = gsap.quickTo(root, 'y', { duration: reduced ? 0 : 0.2, ease: 'power3.out' });

    let shown = false;
    let state: State = 'default';
    let pressed = false;
    let lastX = -1;
    let lastY = -1;
    let scrollFrame = 0;

    const show = () => {
      if (shown) return;
      shown = true;
      html.classList.add('has-cursor');
      gsap.to(root, { autoAlpha: 1, duration: 0.2, overwrite: 'auto' });
    };

    const hide = () => {
      if (!shown) return;
      shown = false;
      html.classList.remove('has-cursor');
      gsap.to(root, { autoAlpha: 0, duration: 0.15, overwrite: 'auto' });
    };

    const stateOf = (el: Element | null): State => {
      if (!el || !(el instanceof Element)) return 'default';
      if (el.closest(TEXTUAL)) return 'text';
      if (el.closest(CLICKABLE)) return 'link';
      return 'default';
    };

    /** Writes the dot and ring for the state (and the press). */
    const paint = () => {
      const dotScale = state === 'text' ? 0 : state === 'link' ? 0.5 : 1;
      gsap.to(dot, {
        scale: pressed && dotScale ? dotScale * 0.7 : dotScale,
        duration: D,
        ease: 'power2.out',
        overwrite: 'auto',
      });
      gsap.to(ring, {
        scale: state === 'link' ? (pressed ? 0.85 : 1) : 0,
        duration: D,
        ease: state === 'link' && !pressed ? 'back.out(1.6)' : 'power2.out',
        overwrite: 'auto',
      });
    };

    const apply = (next: State) => {
      if (next === state) return;
      state = next;
      paint();
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      lastX = e.clientX;
      lastY = e.clientY;
      if (!shown) {
        // Snap on (re)entry — no glide in from wherever it was last hidden.
        gsap.set(root, { x: lastX, y: lastY });
        show();
      } else {
        xTo(lastX);
        yTo(lastY);
      }
      apply(stateOf(e.target as Element | null));
    };

    // relatedTarget is null only when the pointer has left the window.
    const onOut = (e: MouseEvent) => {
      if (!e.relatedTarget) hide();
    };

    // The page moves under a still pointer: re-read what is beneath it.
    const onScroll = () => {
      if (lastX < 0 || scrollFrame) return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
        apply(stateOf(document.elementFromPoint(lastX, lastY)));
      });
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      pressed = true;
      paint();
    };
    const onUp = () => {
      if (!pressed) return;
      pressed = false;
      paint();
    };

    const onVisibility = () => {
      if (document.hidden) hide();
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    window.addEventListener('pointercancel', onUp, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('blur', hide);
    document.addEventListener('mouseout', onOut);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('blur', hide);
      document.removeEventListener('mouseout', onOut);
      document.removeEventListener('visibilitychange', onVisibility);
      if (scrollFrame) cancelAnimationFrame(scrollFrame);
      html.classList.remove('has-cursor');
      gsap.killTweensOf([root, dot, ring]);
    };
  }, [inStudio]);

  if (inStudio) return null;

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[9999]"
      style={{ mixBlendMode: 'difference', opacity: 0, visibility: 'hidden' }}
    >
      <div
        ref={dotRef}
        className="absolute rounded-full"
        style={{
          left: -DOT / 2,
          top: -DOT / 2,
          width: DOT,
          height: DOT,
          background: '#ffffff',
        }}
      />
      <div
        ref={ringRef}
        className="absolute rounded-full"
        style={{
          left: -RING / 2,
          top: -RING / 2,
          width: RING,
          height: RING,
          border: '1.5px solid #ffffff',
        }}
      />
    </div>
  );
}
