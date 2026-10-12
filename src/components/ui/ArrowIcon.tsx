import type { SVGProps } from 'react';

/** SVG avoids the coloured emoji fallback used by mobile fonts. */
export default function ArrowIcon({
  direction = 'right',
  className = '',
  ...props
}: SVGProps<SVGSVGElement> & { direction?: 'right' | 'up-right' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={`inline-block h-[1em] w-[1em] shrink-0 align-middle ${className}`}
      {...props}
    >
      <path
        d={direction === 'up-right' ? 'M5 19 19 5M5 5h14v14' : 'M3 12h18m-7-7 7 7-7 7'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}
