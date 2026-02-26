import { cn } from '@/lib/utils/cn';
import type { ReactNode } from 'react';

type Background = 'void' | 'surface' | 'custom';

const bgClasses: Record<Background, string> = {
  void: 'bg-void',
  surface: 'bg-surface',
  custom: '',
};

interface SectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
  background?: Background;
}

export default function Section({ children, className, id, background = 'void' }: SectionProps) {
  return (
    <section id={id} className={cn('py-section', bgClasses[background], className)}>
      {children}
    </section>
  );
}
