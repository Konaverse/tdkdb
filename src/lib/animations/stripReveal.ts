import { gsap } from './gsap';

/* ───────────────────────────────────────────────────────────────────────────
   stripReveal — THE entrance for every image that is not full bleed.

   The frame is cut into horizontal strips of the page's ground colour laid
   over the picture. Each strip wipes away left to right, the top one first
   and the bottom one last, so the picture is uncovered in courses, while the
   render inside settles out of a slight over-scale.

   Why covers and not clip-paths or masks: a cover is a solid box animated
   by scaleX (origin right), which the compositor does alone; a clip-path or
   mask on the image would re-rasterise the photograph on every frame. The
   covers are created here, sized in %, overlap by 1px so no seam shows, and
   are removed from the DOM the moment the reveal ends.

   Use it through <RevealFrame> in React markup, or call it directly inside a
   section's own gsap.context when the frame is part of a larger timeline
   (pass scroll: false and add the returned timeline to yours). Call revert()
   on cleanup either way.

   The cover must match what is behind the frame — white everywhere today.
   ─────────────────────────────────────────────────────────────────────────── */

export const STRIP_REVEAL = {
  /** Target strip height in px; the count follows the frame's height. */
  stripHeight: 110,
  minStrips: 3,
  maxStrips: 12,
  duration: 0.95,
  stagger: 0.07,
  ease: 'power3.inOut',
  settleFrom: 1.1,
  settleDuration: 1.9,
  /** Fires as the frame's top edge clears the bottom 8% of the screen. */
  start: 'top 92%',
} as const;

export interface StripRevealOptions {
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

export function stripReveal(
  frame: HTMLElement,
  {
    cover = '#ffffff',
    settle = null,
    scroll = true,
    trigger = frame,
    start = STRIP_REVEAL.start,
  }: StripRevealOptions = {},
): { tl: gsap.core.Timeline; revert: () => void } {
  const S = STRIP_REVEAL;
  if (getComputedStyle(frame).position === 'static') frame.style.position = 'relative';

  const n = gsap.utils.clamp(
    S.minStrips,
    S.maxStrips,
    Math.round(frame.offsetHeight / S.stripHeight),
  );

  const layer = document.createElement('div');
  layer.setAttribute('aria-hidden', 'true');
  Object.assign(layer.style, {
    position: 'absolute',
    inset: '0',
    zIndex: '20',
    pointerEvents: 'none',
    overflow: 'hidden',
  });
  const strips = Array.from({ length: n }, (_, i) => {
    const strip = document.createElement('div');
    Object.assign(strip.style, {
      position: 'absolute',
      left: '0',
      top: `${(i * 100) / n}%`,
      width: '100%',
      height: `calc(${100 / n}% + 1px)`,
      background: cover,
      transformOrigin: '100% 50%',
    });
    layer.appendChild(strip);
    return strip;
  });
  frame.appendChild(layer);

  const tl = gsap.timeline({
    scrollTrigger: scroll ? { trigger, start, once: true } : undefined,
    onComplete: () => layer.remove(),
  });
  tl.to(strips, { scaleX: 0, duration: S.duration, ease: S.ease, stagger: S.stagger }, 0);
  if (settle) {
    tl.fromTo(
      settle,
      { scale: S.settleFrom },
      { scale: 1, duration: S.settleDuration, ease: 'power2.out' },
      0,
    );
  }

  return {
    tl,
    revert: () => {
      tl.scrollTrigger?.kill();
      tl.kill();
      layer.remove();
      if (settle) gsap.set(settle, { clearProps: 'transform' });
    },
  };
}
