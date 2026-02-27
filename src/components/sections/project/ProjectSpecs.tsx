import Section from '@/components/layout/Section';
import GridWrapper from '@/components/layout/GridWrapper';
import FadeUp from '@/components/animations/FadeUp';

export interface ProjectSpec {
  label: string;
  value: string;
}

interface ProjectSpecsProps {
  specs: ProjectSpec[];
}

export default function ProjectSpecs({ specs }: ProjectSpecsProps) {
  if (!specs || specs.length === 0) return null;

  return (
    <Section background="surface">
      <GridWrapper>
        <FadeUp>
          <p className="text-label mb-12 text-stone">SPECIFICATIONS</p>
        </FadeUp>
        <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 lg:grid-cols-3">
          {specs.map((spec) => (
            <FadeUp key={spec.label}>
              <div className="border-b border-border py-6 pr-8">
                <span className="text-label block text-stone">{spec.label}</span>
                <span className="text-body mt-1 block text-paper">{spec.value}</span>
              </div>
            </FadeUp>
          ))}
        </div>
      </GridWrapper>
    </Section>
  );
}
