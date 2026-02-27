import Section from '@/components/layout/Section';
import GridWrapper from '@/components/layout/GridWrapper';
import FadeUp from '@/components/animations/FadeUp';

interface ProjectLocationProps {
  address: string;
  mapEmbedUrl?: string;
}

export default function ProjectLocation({ address, mapEmbedUrl }: ProjectLocationProps) {
  return (
    <Section>
      <GridWrapper>
        <FadeUp>
          <p className="text-label mb-8 text-stone">LOCATION</p>
        </FadeUp>
        <FadeUp delay={100}>
          <div className="flex flex-col gap-6">
            <p className="text-body-lg text-paper">{address}</p>
            {mapEmbedUrl && (
              <div className="aspect-video w-full overflow-hidden border border-border">
                <iframe
                  src={mapEmbedUrl}
                  title="Project location map"
                  className="h-full w-full"
                  style={{ filter: 'grayscale(1) invert(0.9)' }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}
          </div>
        </FadeUp>
      </GridWrapper>
    </Section>
  );
}
