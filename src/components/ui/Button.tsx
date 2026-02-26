'use client';

import { useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

export type ButtonVariant = 'primary' | 'ghost' | 'text';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  magnetic?: boolean;
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-5 py-2.5',
  md: 'px-8 py-4',
  lg: 'px-10 py-5',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  href,
  onClick,
  children,
  className,
  disabled = false,
  magnetic = false,
}: ButtonProps) {
  const springTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (springTimeoutRef.current) clearTimeout(springTimeoutRef.current);
    };
  }, []);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!magnetic) return;
      if (!window.matchMedia('(pointer: fine)').matches) return;

      const el = e.currentTarget;
      const onMove = (evt: MouseEvent) => {
        const r = el.getBoundingClientRect();
        const dx = evt.clientX - (r.left + r.width / 2);
        const dy = evt.clientY - (r.top + r.height / 2);
        const clamp = (v: number) => Math.max(-12, Math.min(12, v * 0.3));
        el.style.transform = `translate(${clamp(dx)}px, ${clamp(dy)}px)`;
      };

      (el as HTMLElement & { __mag?: typeof onMove }).__mag = onMove;
      el.addEventListener('mousemove', onMove);
    },
    [magnetic],
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!magnetic) return;
      const el = e.currentTarget as HTMLElement & { __mag?: (e: MouseEvent) => void };

      if (el.__mag) {
        el.removeEventListener('mousemove', el.__mag);
        delete el.__mag;
      }

      el.style.transition = 'transform 400ms var(--ease-spring)';
      el.style.transform = 'translate(0px, 0px)';

      if (springTimeoutRef.current) clearTimeout(springTimeoutRef.current);
      springTimeoutRef.current = setTimeout(() => {
        el.style.transition = '';
        el.style.transform = '';
      }, 400);
    },
    [magnetic],
  );

  const rootCn = cn(
    'inline-flex items-center justify-center group select-none text-label',
    variant === 'primary' &&
      'bg-paper text-void hover:bg-threshold transition-colors duration-fast ease-smooth',
    variant === 'ghost' && [
      'bg-transparent text-paper border border-border',
      'hover:border-paper transition-[border-color] duration-fast ease-smooth',
    ],
    variant === 'text' &&
      'bg-transparent text-stone hover:text-paper transition-colors duration-fast ease-smooth',
    variant !== 'text' && sizeClasses[size],
    disabled && 'opacity-40 pointer-events-none',
    className,
  );

  const inner = (
    <span
      className={cn(
        'inline-flex items-center',
        variant === 'primary' && 'gap-2',
        variant === 'text' && 'relative pb-px',
      )}
    >
      {children}
      {variant === 'primary' && (
        <span
          className="inline-block transition-transform duration-fast ease-smooth group-hover:translate-x-1"
          aria-hidden="true"
        >
          →
        </span>
      )}
      {variant === 'text' && (
        <span className="absolute bottom-0 left-0 h-px w-full origin-left scale-x-0 bg-current transition-transform duration-fast ease-smooth group-hover:scale-x-100" />
      )}
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={rootCn}
        aria-disabled={disabled || undefined}
        onClick={disabled ? (e) => e.preventDefault() : onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={rootCn}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {inner}
    </button>
  );
}

export function PrimaryButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button {...props} variant="primary" />;
}

export function GhostButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button {...props} variant="ghost" />;
}

export function TextButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button {...props} variant="text" />;
}
