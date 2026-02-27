import Section from '@/components/layout/Section';
import GridWrapper from '@/components/layout/GridWrapper';
import FadeUp from '@/components/animations/FadeUp';
import TextReveal from '@/components/animations/TextReveal';
import { GhostButton } from '@/components/ui/Button';

type CTAType = 'showcase' | 'register-interest' | 'contact';

interface ProjectCTAProps {
  ctaType: CTAType;
}

export default function ProjectCTA({ ctaType }: ProjectCTAProps) {
  const heading =
    ctaType === 'register-interest'
      ? 'INTERESTED IN THIS DEVELOPMENT?'
      : 'WANT TO WORK WITH US?';

  const subtext =
    ctaType === 'register-interest'
      ? 'Register your interest and we will keep you informed as the project progresses.'
      : 'Get in touch to discuss your next project.';

  return (
    <Section>
      <GridWrapper>
        <FadeUp>
          <div className="flex flex-col items-start gap-6">
            <TextReveal tag="h2" className="text-display-md max-w-xl text-paper">
              {heading}
            </TextReveal>
            <p className="text-body-lg text-stone">{subtext}</p>
            <GhostButton href="/contact">Get in Touch</GhostButton>
          </div>
        </FadeUp>
      </GridWrapper>
    </Section>
  );
}
