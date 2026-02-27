import Section from '@/components/layout/Section';
import GridWrapper from '@/components/layout/GridWrapper';
import FadeUp from '@/components/animations/FadeUp';
import TextReveal from '@/components/animations/TextReveal';

interface ProjectDescriptionProps {
  title: string;
  body: string[];
}

export default function ProjectDescription({ title, body }: ProjectDescriptionProps) {
  return (
    <Section>
      <GridWrapper>
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
          <FadeUp>
            <TextReveal tag="h2" className="text-display-md text-threshold leading-tight">
              {title}
            </TextReveal>
          </FadeUp>
          <div className="flex flex-col gap-6">
            {body.map((para, i) => (
              <FadeUp key={i} delay={i * 100}>
                <p className="text-body-lg text-stone">{para}</p>
              </FadeUp>
            ))}
          </div>
        </div>
      </GridWrapper>
    </Section>
  );
}
