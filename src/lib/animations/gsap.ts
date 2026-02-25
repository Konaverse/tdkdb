import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

let isInitialized = false;

export function gsapInit(): void {
  if (isInitialized || typeof window === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  gsap.defaults({
    ease: 'power3.out',
    duration: 0.8,
  });

  isInitialized = true;
}

export function killAllScrollTriggers(): void {
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  ScrollTrigger.clearMatchMedia();
}

export { gsap, ScrollTrigger };
