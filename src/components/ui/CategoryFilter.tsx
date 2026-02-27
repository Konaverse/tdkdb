'use client';

import { cn } from '@/lib/utils/cn';

interface CategoryFilterProps {
  categories: string[];
  active: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function CategoryFilter({
  categories,
  active,
  onChange,
  className,
}: CategoryFilterProps) {
  return (
    <div className={cn('flex flex-wrap gap-6', className)}>
      {categories.map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => onChange(cat)}
          className={cn(
            'text-label pb-1 transition-colors duration-fast ease-smooth',
            active === cat
              ? 'border-b border-threshold text-threshold'
              : 'text-stone hover:text-paper',
          )}
        >
          {cat.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
