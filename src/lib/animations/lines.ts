import { gsap, SplitText } from './gsap';

/**
 * Splits a text block into lines, each in its own mask, for the site's
 * "written on left to right" reveal (a clip-path wipe per line). Masks are
 * fit-content so the wipe travels the line's own length, not the column's.
 *
 * Call inside a gsap.context so the split is reverted with it; revert it
 * yourself once the reveal has played, so a later resize re-flows the text
 * naturally instead of keeping stale line breaks.
 */
export function maskLines(el: Element): { split: SplitText; lines: HTMLElement[] } {
  const split = SplitText.create(el, { type: 'lines', mask: 'lines' });
  const lines = split.masks as HTMLElement[];
  gsap.set(lines, { width: 'fit-content', marginRight: 'auto' });
  return { split, lines };
}

export const LINE_HIDDEN = 'inset(0% 100% 0% 0%)';
export const LINE_SHOWN = 'inset(0% 0% 0% 0%)';
