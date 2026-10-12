/** Phones and touch tablets use a lighter version of the same motion. */
export const MOBILE_MOTION_QUERY = '(max-width: 1023px), (hover: none) and (pointer: coarse)';

export function usesMobileMotion(): boolean {
  return window.matchMedia(MOBILE_MOTION_QUERY).matches;
}
