'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { gsap, gsapInit } from '@/lib/animations/gsap';
import { cn } from '@/lib/utils/cn';

export interface AccordionItem {
  question: string;
  answer: string | React.ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  className?: string;
}

function AccordionRow({
  item,
  isOpen,
  onToggle,
}: {
  item: AccordionItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);
  const initialized = useRef(false);

  useLayoutEffect(() => {
    gsapInit();

    const panel = panelRef.current;
    const icon = iconRef.current;
    if (!panel || !icon) return;

    if (!initialized.current) {
      // Set closed state without animation on mount
      gsap.set(panel, { height: 0, overflow: 'hidden' });
      initialized.current = true;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isOpen) {
      if (prefersReducedMotion) {
        gsap.set(panel, { height: 'auto' });
        gsap.set(icon, { rotation: 45 });
      } else {
        gsap.set(panel, { height: 'auto' });
        const fullHeight = panel.offsetHeight;
        gsap.fromTo(
          panel,
          { height: 0 },
          { height: fullHeight, duration: 0.4, ease: 'power3.out', clearProps: 'height' },
        );
        gsap.to(icon, { rotation: 45, duration: 0.3, ease: 'power2.out' });
      }
    } else {
      if (prefersReducedMotion) {
        gsap.set(panel, { height: 0 });
        gsap.set(icon, { rotation: 0 });
      } else {
        gsap.to(panel, { height: 0, duration: 0.35, ease: 'power3.in' });
        gsap.to(icon, { rotation: 0, duration: 0.3, ease: 'power2.in' });
      }
    }
  }, [isOpen]);

  return (
    <div className="border-b border-border">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-6 py-6 text-left"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="text-body-lg text-paper">{item.question}</span>
        <span
          ref={iconRef}
          className="flex-shrink-0 text-xl font-light leading-none text-threshold"
          aria-hidden="true"
        >
          +
        </span>
      </button>
      <div ref={panelRef} style={{ overflow: 'hidden' }}>
        <div className={cn('pb-6 text-body-lg text-stone')}>{item.answer}</div>
      </div>
    </div>
  );
}

export default function Accordion({ items, className }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleToggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className={cn('border-t border-border', className)}>
      {items.map((item, i) => (
        <AccordionRow
          key={i}
          item={item}
          isOpen={openIndex === i}
          onToggle={() => handleToggle(i)}
        />
      ))}
    </div>
  );
}
