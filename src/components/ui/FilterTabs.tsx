'use client';

import { cn } from '@/lib/utils/cn';

interface FilterTabsProps {
  options: string[];
  active: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function FilterTabs({ options, active, onChange, className }: FilterTabsProps) {
  return (
    <div className={cn('flex flex-wrap gap-6', className)}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            'pb-1 text-label transition-colors duration-fast ease-smooth',
            active === option
              ? 'border-b border-threshold text-threshold'
              : 'text-stone hover:text-paper',
          )}
        >
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
