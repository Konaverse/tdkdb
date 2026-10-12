import type { CSSProperties } from 'react';

/** Small, readable notes stay inside the photograph and above its motion layers. */
export default function ImageFootnote({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: CSSProperties;
}) {
  return (
    <span
      data-image-caption
      className="pointer-events-none absolute bottom-4 left-4 z-10 max-w-[calc(100%-32px)] font-mono text-[10px] font-normal leading-[1.5] tracking-[0.025em] text-white sm:bottom-5 sm:left-5 sm:text-[11px]"
      style={{ textShadow: '0 1px 4px rgba(0,0,0,0.85), 0 0 12px rgba(0,0,0,0.45)', ...style }}
    >
      {children}
    </span>
  );
}
