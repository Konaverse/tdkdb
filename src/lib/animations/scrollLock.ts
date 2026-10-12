import { getLenis } from './lenis';

let locks = 0;
let restore: (() => void) | null = null;

/** Overlay locks work with native touch scrolling as well as desktop Lenis. */
export function lockPageScroll(): () => void {
  if (locks++ === 0) {
    const root = document.documentElement;
    const body = document.body;
    const rootOverflow = root.style.overflow;
    const bodyOverflow = body.style.overflow;
    const lenis = getLenis();
    const wasStopped = lenis?.isStopped;
    root.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    lenis?.stop();
    restore = () => {
      root.style.overflow = rootOverflow;
      body.style.overflow = bodyOverflow;
      if (!wasStopped) getLenis()?.start();
    };
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (--locks === 0) {
      restore?.();
      restore = null;
    }
  };
}
