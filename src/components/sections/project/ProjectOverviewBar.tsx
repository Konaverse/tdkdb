import GridWrapper from '@/components/layout/GridWrapper';

export interface OverviewItem {
  label: string;
  value: string;
}

interface ProjectOverviewBarProps {
  items: OverviewItem[];
}

export default function ProjectOverviewBar({ items }: ProjectOverviewBarProps) {
  return (
    <div className="border-b border-border bg-surface">
      <GridWrapper>
        <div className="flex flex-wrap divide-x divide-border">
          {items.map((item) => (
            <div key={item.label} className="flex flex-col gap-1 px-8 py-6 first:pl-0">
              <span className="text-label text-stone">{item.label}</span>
              <span className="text-body text-paper">{item.value}</span>
            </div>
          ))}
        </div>
      </GridWrapper>
    </div>
  );
}
