import { gsap, SplitText } from './gsap';

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
