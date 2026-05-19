'use client';

import { useRef, useEffect } from 'react';
import { gsap } from '@/lib/animations/gsap';

type CursorState = 'default' | 'hover' | 'node' | 'view' | 'scroll';

const STATE: Record<
  CursorState,
  {
    size: number;
    bg: string;
    borderColor: string;
    blend: string;
    text: string;
    crosshair: boolean;
  }
> = {
  default: {
    size: 12,
    bg: 'transparent',
    borderColor: 'rgba(245,240,232,1)',
    blend: 'difference',
    text: '',
    crosshair: false,
  },
  hover: {
    size: 40,
    bg: 'var(--color-threshold)',
    borderColor: 'transparent',
    blend: 'normal',
    text: '',
    crosshair: false,
  },
  node: {
    size: 60,
    bg: 'transparent',
    borderColor: 'rgba(102,151,159,1)',
    blend: 'normal',
    text: '',
    crosshair: true,
  },
  view: {
    size: 80,
    bg: 'rgba(102,151,159,0.9)',
    borderColor: 'transparent',
    blend: 'normal',
    text: 'VIEW',
    crosshair: false,
  },
  scroll: {
    size: 6,
    bg: 'var(--color-paper)',
    borderColor: 'transparent',
    blend: 'normal',
    text: '',
    crosshair: false,
  },
};

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const crosshairRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only on fine-pointer (desktop) devices
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const cursor = cursorRef.current!;
    const text = textRef.current!;
    const crosshair = crosshairRef.current!;

    // Reveal the element (hidden by default to avoid position flash)
    cursor.style.display = 'flex';

    // quickTo for butter-smooth continuous tracking
    const xTo = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3.out' });
    const yTo = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3.out' });

    let isFirstMove = true;
    let currentState: CursorState = 'default';

    const applyState = (next: CursorState) => {
      if (next === currentState) return;
      currentState = next;
      const s = STATE[next];

      // Animate size + bg in one call; overwrite prevents queue buildup
      gsap.to(cursor, {
        width: s.size,
        height: s.size,
        backgroundColor: s.bg,
        borderColor: s.borderColor,
        duration: 0.2,
        ease: 'power2.out',
        overwrite: 'auto',
      });

      // blend mode is not animatable — set directly
      cursor.style.mixBlendMode = s.blend as CSSStyleDeclaration['mixBlendMode'];

      // Text label (VIEW etc.)
      text.textContent = s.text;
      gsap.set(text, { opacity: s.text ? 1 : 0 });

      // Crosshair lines
      gsap.set(crosshair, { opacity: s.crosshair ? 1 : 0 });
    };

    const onMove = (e: MouseEvent) => {
      if (isFirstMove) {
        // Snap instantly on first entry — eliminates the ease-from-origin stutter
        gsap.set(cursor, { x: e.clientX, y: e.clientY, opacity: 1 });
        isFirstMove = false;
      } else {
        xTo(e.clientX);
        yTo(e.clientY);
      }
    };

    const onLeave = () => {
      gsap.to(cursor, { opacity: 0, duration: 0.15, overwrite: 'auto' });
      // Reset so the next entry also snaps
      isFirstMove = true;
    };

    const onOver = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      const dataCursor = el.closest('[data-cursor]');
      if (dataCursor) {
        applyState(dataCursor.getAttribute('data-cursor') as CursorState);
      } else if (el.closest('a, button')) {
        applyState('hover');
      } else {
        applyState('default');
      }
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    document.body.addEventListener('mouseleave', onLeave);
    document.body.addEventListener('mouseover', onOver, { passive: true });

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.body.removeEventListener('mouseleave', onLeave);
      document.body.removeEventListener('mouseover', onOver);
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className="pointer-events-none fixed left-0 top-0 z-[9999] items-center justify-center rounded-full"
      style={{
        display: 'none', // shown in useEffect after pointer check
        width: 12,
        height: 12,
        opacity: 0, // faded in on first mousemove
        backgroundColor: 'transparent',
        border: '1px solid rgba(245,240,232,1)',
        transform: 'translate(-50%, -50%)',
        mixBlendMode: 'difference',
        willChange: 'transform', // GPU layer hint
      }}
    >
      <span ref={textRef} className="text-label text-void" style={{ opacity: 0 }} />

      {/* Crosshair for node state */}
      <div
        ref={crosshairRef}
        className="pointer-events-none absolute inset-0"
        style={{ opacity: 0 }}
      >
        <div className="absolute left-1/2 top-1/2 h-full w-[1px] -translate-x-1/2 -translate-y-1/2 bg-threshold" />
        <div className="absolute left-1/2 top-1/2 h-[1px] w-full -translate-x-1/2 -translate-y-1/2 bg-threshold" />
      </div>
    </div>
  );
}
