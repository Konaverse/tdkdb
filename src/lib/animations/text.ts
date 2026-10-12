import { gsap, SplitText, ScrollTrigger } from './gsap';

/** Cached fonts can initialize before the next paint; cold fonts wait once. */
export function whenFontsReady(callback: () => void): () => void {
  let cancelled = false;
  const run = () => {
    if (!cancelled) callback();
  };
  if (!document.fonts || document.fonts.status === 'loaded') run();
  else document.fonts.ready.then(run);
  return () => {
    cancelled = true;
  };
}

/** Prepare below-fold text shortly before it can enter the screen. */
export function nearViewport(trigger: Element, prepare: () => void): void {
  const context = gsap.context();
  const bounds = trigger.getBoundingClientRect();
  // An anchor jump has already passed these blocks; their resting copy stays.
  if (bounds.bottom < 0) return;
  const run = () => context.add(prepare);
  if (bounds.top <= window.innerHeight * 1.25) run();
  else ScrollTrigger.create({ trigger, start: 'top 125%', once: true, onEnter: run });
}

/** Per-letter masks retain word wrapping and the original accessible text.
 * Create inside a GSAP context so route changes restore the original markup.
 */
export function maskChars(target: gsap.DOMTarget) {
  const split = SplitText.create(target, {
    type: 'words,chars',
    mask: 'chars',
    tag: 'span',
    charsClass: 'rise-char',
    smartWrap: true,
    // Keep nested links and their accessible names intact.
    aria: 'none',
  });
  gsap.set(split.words, { display: 'inline-block', whiteSpace: 'nowrap' });
  gsap.set(split.masks, {
    display: 'inline-block',
    position: 'relative',
    paddingTop: '0.2em',
    paddingBottom: '0.14em',
    marginTop: '-0.2em',
    marginBottom: '-0.14em',
  });
  gsap.set(split.chars, { display: 'inline-block', position: 'relative', ...CHAR_HIDDEN });
  return { split, chars: split.chars };
}

export const CHAR_HIDDEN = { yPercent: 135, y: 0 };

/** A bounded stagger keeps longer passages from becoming a slow typewriter. */
export function riseIn(chars: Element[], overrides: gsap.TweenVars = {}): gsap.TweenVars {
  return {
    yPercent: 0,
    y: 0,
    duration: 0.95,
    ease: 'power4.out',
    stagger: Math.min(0.026, 0.45 / Math.max(1, chars.length - 1)),
    ...overrides,
  };
}
