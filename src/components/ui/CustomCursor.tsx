'use client';

import { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { gsap } from 'gsap';

type CursorState = 'default' | 'hover' | 'node' | 'view' | 'scroll';

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [cursorState, setCursorState] = useState<CursorState>('default');
  const [isVisible, setIsVisible] = useState(false);

  // To avoid unmounting the layout, we just check device capability in useEffect
  const [isPointerFine, setIsPointerFine] = useState(true);

  useEffect(() => {
    const isFine = window.matchMedia('(pointer: fine)').matches;
    setIsPointerFine(isFine);
  }, []);

  useLayoutEffect(() => {
    if (!isPointerFine || !cursorRef.current) return;

    // Use quickTo for optimal performance continuous updating
    const xTo = gsap.quickTo(cursorRef.current, 'x', { duration: 0.3, ease: 'power3' });
    const yTo = gsap.quickTo(cursorRef.current, 'y', { duration: 0.3, ease: 'power3' });

    let isInitialized = false;

    const moveCursor = (e: MouseEvent) => {
      // Offset by half the theoretical max size to keep it centered perfectly
      // We handle visual sizing inside the div, but transform origin is center center natively
      xTo(e.clientX);
      yTo(e.clientY);

      if (!isInitialized) {
        setIsVisible(true);
        isInitialized = true;
      }
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    // Event Delegation: Detect data-cursor attributes
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Traverse up to find if we're hovering a child of a custom cursor target
      const cursorTarget = target.closest('[data-cursor]');

      if (cursorTarget) {
        const type = cursorTarget.getAttribute('data-cursor') as CursorState;
        setCursorState(type);
      } else {
        // Also check if we are hovering a button or a tag without explicit data-cursor
        const interactiveChild = target.closest('a, button');
        if (interactiveChild) {
          setCursorState('hover');
        } else {
          setCursorState('default');
        }
      }
    };

    window.addEventListener('mousemove', moveCursor);
    document.body.addEventListener('mouseleave', handleMouseLeave);
    document.body.addEventListener('mouseenter', handleMouseEnter);
    document.body.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      document.body.removeEventListener('mouseleave', handleMouseLeave);
      document.body.removeEventListener('mouseenter', handleMouseEnter);
      document.body.removeEventListener('mouseover', handleMouseOver);
    };
  }, [isPointerFine]);

  if (!isPointerFine) return null;

  // Render cursor states visually
  let size = 12;
  let bg = 'transparent';
  let border = '1px solid var(--color-paper)';
  let text = '';
  let showCrosshair = false;

  switch (cursorState) {
    case 'hover':
      size = 40;
      bg = 'var(--color-threshold)';
      border = 'none';
      break;
    case 'node':
      size = 60;
      bg = 'transparent';
      border = '1px solid var(--color-threshold)';
      showCrosshair = true;
      break;
    case 'view':
      size = 80;
      bg = 'rgba(102, 151, 159, 0.9)'; // --color-threshold with 90% opacity roughly
      border = 'none';
      text = 'VIEW';
      break;
    case 'scroll':
      size = 6;
      bg = 'var(--color-paper)';
      border = 'none';
      break;
    case 'default':
    default:
      size = 12;
      bg = 'transparent';
      border = '1px solid var(--color-paper)';
      break;
  }

  return (
    <div
      ref={cursorRef}
      className="pointer-events-none fixed left-0 top-0 z-[9999] flex items-center justify-center rounded-full transition-all duration-300 ease-smooth"
      style={{
        width: size,
        height: size,
        backgroundColor: bg,
        border: border,
        transform: `translate(-50%, -50%)`, // Centered perfectly on pointer coords via quickTo
        opacity: isVisible ? 1 : 0,
        mixBlendMode: cursorState === 'default' ? 'difference' : 'normal',
      }}
    >
      {text && (
        <span
          ref={textRef}
          className="text-label text-void opacity-100 transition-opacity duration-300"
        >
          {text}
        </span>
      )}

      {/* Crosshair for node state */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ opacity: showCrosshair ? 1 : 0, transition: 'opacity 300ms' }}
      >
        <div className="absolute left-1/2 top-1/2 h-full w-[1px] -translate-x-1/2 -translate-y-1/2 bg-threshold" />
        <div className="absolute left-1/2 top-1/2 h-[1px] w-full -translate-x-1/2 -translate-y-1/2 bg-threshold" />
      </div>
    </div>
  );
}
