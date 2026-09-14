import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { SplitText } from 'gsap/SplitText';

let isInitialized = false;

export function gsapInit(): void {
  if (isInitialized || typeof window === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger, MotionPathPlugin, SplitText);

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

export { gsap, ScrollTrigger, MotionPathPlugin, SplitText };
