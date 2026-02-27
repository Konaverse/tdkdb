import Section from '@/components/layout/Section';
import GridWrapper from '@/components/layout/GridWrapper';
import FadeUp from '@/components/animations/FadeUp';

interface ProjectProgressProps {
  percent: number;
  label: string;
}

export default function ProjectProgress({ percent, label }: ProjectProgressProps) {
  return (
    <Section>
      <GridWrapper>
        <FadeUp>
          <p className="mb-8 text-label text-stone">CONSTRUCTION PROGRESS</p>
        </FadeUp>
        <FadeUp delay={100}>
          <div className="flex flex-col gap-4">
            <div className="flex items-baseline justify-between">
              <span className="text-display-md text-threshold">{percent}%</span>
              <span className="text-label text-stone">{label}</span>
            </div>
            {/* Progress bar */}
            <div className="h-px w-full bg-border">
              <div
                className="h-px bg-threshold transition-all duration-slow ease-smooth"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </FadeUp>
      </GridWrapper>
    </Section>
  );
}
