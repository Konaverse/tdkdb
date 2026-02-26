import { cn } from '@/lib/utils/cn';
import type { ReactNode } from 'react';

type HTMLTag = keyof JSX.IntrinsicElements;

interface GridWrapperProps {
  children: ReactNode;
  className?: string;
  as?: HTMLTag;
}

export default function GridWrapper({ children, className, as = 'div' }: GridWrapperProps) {
  const Tag = as;
  return (
    // @ts-expect-error -- dynamic tag; all HTMLTag values accept className + style
    <Tag
      className={cn('mx-auto w-full max-w-content', className)}
      style={{ paddingInline: 'clamp(24px, 5vw, 80px)' }}
    >
      {children}
    </Tag>
  );
}
