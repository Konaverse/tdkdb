import { gsap } from './gsap';

/* ───────────────────────────────────────────────────────────────────────────
   imageReveal — THE entrance for every image that is not full bleed.

   The picture is raised from its footing: one cover of the page's ground
   colour lies over the frame and lifts away upward, so the photograph is
   uncovered from the bottom edge to the top, the way a building goes up. One
   edge, one long, even move — no strips, no stagger inside the frame. Under
   it the render settles out of a slight over-scale anchored on its base, so
   the top of the picture comes down onto the frame as the last of the cover
   clears.

   Why a cover and not a clip-path or mask: a cover is a solid box animated by
   scaleY (origin top), which the compositor does alone; a clip-path or mask
   on the image would re-rasterise the photograph on every frame. The cover is
   removed from the DOM the moment the reveal ends.

   Use it through <RevealFrame> in React markup, or call it directly inside a
   section's own gsap.context when the frame is part of a larger timeline
   (pass scroll: false and add the returned timeline to yours). Call revert()
   on cleanup either way.

   The cover must match what is behind the frame — white everywhere today.
   ─────────────────────────────────────────────────────────────────────────── */

export const IMAGE_REVEAL = {
  duration: 1.5,
  ease: 'power2.inOut',
  settleFrom: 1.05,
  settleDuration: 2.2,
  /** Fires as the frame's top edge clears the bottom 8% of the screen. */
  start: 'top 92%',
} as const;

export interface ImageRevealOptions {
  /** The ground behind the frame. */
  cover?: string;
  /** A node inside the frame that settles out of the over-scale. It must not
      carry any other transform (give scroll motion its own child). */
  settle?: Element | null;
  /** Own ScrollTrigger (default), or a bare timeline to nest in yours. */
  scroll?: boolean;
  trigger?: Element;
  start?: string;
}

export function imageReveal(
  frame: HTMLElement,
  {
    cover = '#ffffff',
    settle = null,
    scroll = true,
    trigger = frame,
    start = IMAGE_REVEAL.start,
  }: ImageRevealOptions = {},
): { tl: gsap.core.Timeline; revert: () => void } {
  const R = IMAGE_REVEAL;
  if (getComputedStyle(frame).position === 'static') frame.style.position = 'relative';

  const veil = document.createElement('div');
  veil.setAttribute('aria-hidden', 'true');
  Object.assign(veil.style, {
    position: 'absolute',
    inset: '-1px',
    zIndex: '20',
    pointerEvents: 'none',
    background: cover,
    transformOrigin: '50% 0%',
  });
  frame.appendChild(veil);

  const tl = gsap.timeline({
    scrollTrigger: scroll ? { trigger, start, once: true } : undefined,
    onComplete: () => veil.remove(),
  });
  tl.to(veil, { scaleY: 0, duration: R.duration, ease: R.ease }, 0);
  if (settle) {
    tl.fromTo(
      settle,
      { scale: R.settleFrom, transformOrigin: '50% 100%' },
      { scale: 1, duration: R.settleDuration, ease: 'power2.out' },
      0,
    );
  }

  return {
    tl,
    revert: () => {
      tl.scrollTrigger?.kill();
      tl.kill();
      veil.remove();
      if (settle) gsap.set(settle, { clearProps: 'transform,transformOrigin' });
    },
  };
}
