import type { Metadata } from 'next';
import Link from 'next/link';
import Section from '@/components/layout/Section';
import GridWrapper from '@/components/layout/GridWrapper';
import TextReveal from '@/components/animations/TextReveal';
import FadeUp from '@/components/animations/FadeUp';
import { GhostButton } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Services | TDK Design & Build',
  description:
    'From architecture and construction management to interior design — TDK delivers every phase of your project under one roof.',
};

import { getAllServices } from '@/lib/sanity/queries';
import { cloudinaryUrl } from '@/lib/cloudinary/transforms';

export const revalidate = 60;

const processSteps = [
  { step: '01', label: 'Brief', description: 'Understanding your goals, site, and constraints.' },
  {
    step: '02',
    label: 'Design',
    description: 'Concept development, schematics, and technical drawings.',
  },
  {
    step: '03',
    label: 'Approvals',
    description: 'Planning permissions, permits, and regulatory compliance.',
  },
  {
    step: '04',
    label: 'Construction',
    description: 'On-site management, quality control, and progress reporting.',
  },
  {
    step: '05',
    label: 'Handover',
    description: 'Snagging, final inspections, and keys in your hand.',
  },
];

export default async function ServicesPage() {
  const services = await getAllServices();

  return (
    <main className="bg-void text-paper">
      {/* ── Hero ── */}
      <section className="flex min-h-[50vh] items-end pb-24 pt-40">
        <GridWrapper>
          <p className="mb-4 text-label text-stone">WHAT WE DO</p>
          <TextReveal tag="h1" className="max-w-3xl text-display-lg text-paper">
            FOUR DISCIPLINES. ONE VISION.
          </TextReveal>
        </GridWrapper>
      </section>

      {/* ── Services Grid ── */}
      <Section>
        <GridWrapper>
          <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2">
            {services.map((service, i) => (
              <FadeUp key={service.slug.current} delay={i * 80}>
                <Link
                  href={`/en/services/${service.slug.current}`}
                  className="group relative flex h-full flex-col overflow-hidden border border-transparent bg-void transition-colors duration-fast ease-smooth hover:border-paper hover:bg-surface"
                >
                  {/* Background Hover Image */}
                  {service.heroImageId && (
                    <img
                      src={cloudinaryUrl(service.heroImageId, { width: 800 })}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-20"
                    />
                  )}

                  {/* Content Container */}
                  <div className="relative z-10 flex h-full flex-col gap-6 p-10">
                    <span className="text-display-lg font-light text-threshold opacity-20 transition-opacity duration-500 group-hover:opacity-40">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="flex flex-1 flex-col gap-4">
                      <h2 className="text-heading text-paper">{service.title}</h2>
                      <p className="flex-1 text-body-lg text-stone transition-colors duration-500 group-hover:text-paper">{service.shortDescription}</p>
                    </div>
                    <span className="text-label text-stone transition-colors duration-fast ease-smooth group-hover:text-paper">
                      EXPLORE →
                    </span>
                  </div>
                </Link>
              </FadeUp>
            ))}
          </div>
        </GridWrapper>
      </Section>

      {/* ── Process Overview ── */}
      <Section background="surface">
        <GridWrapper>
          <FadeUp>
            <p className="mb-12 text-label text-stone">OUR PROCESS</p>
          </FadeUp>
          {/* Desktop horizontal timeline */}
          <div className="hidden lg:block">
            <div className="relative flex items-start gap-0">
              {/* Connecting line */}
              <div className="absolute left-0 right-0 top-3 h-px bg-border" />
              {processSteps.map((step) => (
                <div key={step.step} className="relative flex flex-1 flex-col gap-4 pr-8">
                  {/* Step dot */}
                  <div className="mb-4 h-6 w-6 rounded-full border border-threshold bg-void" />
                  <span className="text-label text-threshold">{step.step}</span>
                  <h3 className="text-body font-semibold text-paper">{step.label}</h3>
                  <p className="text-body text-stone">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Mobile vertical list */}
          <div className="flex flex-col gap-8 lg:hidden">
            {processSteps.map((step) => (
              <div key={step.step} className="flex gap-6 border-b border-border pb-8 last:border-0">
                <span className="text-label text-threshold">{step.step}</span>
                <div className="flex flex-col gap-1">
                  <h3 className="text-body font-semibold text-paper">{step.label}</h3>
                  <p className="text-body text-stone">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </GridWrapper>
      </Section>

      {/* ── CTA ── */}
      <Section>
        <GridWrapper>
          <FadeUp>
            <div className="flex flex-col items-start gap-8">
              <TextReveal tag="h2" className="max-w-xl text-display-md text-paper">
                HAVE A PROJECT IN MIND?
              </TextReveal>
              <GhostButton href="/contact">Start a Conversation</GhostButton>
            </div>
          </FadeUp>
        </GridWrapper>
      </Section>
    </main>
  );
}
