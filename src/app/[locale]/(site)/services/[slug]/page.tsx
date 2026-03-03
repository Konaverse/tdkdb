import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { heroImage } from '@/lib/cloudinary/transforms';
import Section from '@/components/layout/Section';
import GridWrapper from '@/components/layout/GridWrapper';
import TextReveal from '@/components/animations/TextReveal';
import FadeUp from '@/components/animations/FadeUp';
import Accordion from '@/components/ui/Accordion';
import { GhostButton } from '@/components/ui/Button';
import Link from 'next/link';

import { getServiceBySlug, getAllServices } from '@/lib/sanity/queries';
import PortableText from '@/components/sanity/PortableText';

export const revalidate = 60;

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) return {};

  return {
    title: service.seo?.title || `${service.title} | TDK Design & Build`,
    description: service.seo?.description || service.shortDescription || '',
  };
}

export async function generateStaticParams() {
  const services = await getAllServices();
  return services.map((s) => ({ slug: s.slug.current }));
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) notFound();

  // For related projects, we'll map them similarly to Insights for now
  // Ideally, relatedProjectSlugs should be hydrated byGROQ
  const relatedProjects = (service.relatedProjectSlugs || []).map((relatedSlug) => ({
    slug: relatedSlug,
    title: relatedSlug.toUpperCase(),
    location: '',
    imageId: '',
  }));

  return (
    <main className="bg-void text-paper">
      {/* ── Hero ── */}
      <section className="relative flex min-h-[60vh] items-end pb-24 pt-40">
        <img
          src={heroImage('clients/tdkdb/armonia/exterior/armonia_front_angle_day')}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: 0.3 }}
        />
        <div className="via-void/60 absolute inset-0 bg-gradient-to-t from-void to-transparent" />
        <GridWrapper className="relative z-10">
          <p className="mb-4 text-label text-threshold">SERVICE</p>
          <TextReveal tag="h1" className="max-w-3xl text-display-lg text-paper">
            {service.shortDescription || service.title}
          </TextReveal>
          <p className="mt-4 text-heading font-light text-stone">{service.title}</p>
        </GridWrapper>
      </section>

      {/* ── Description ── */}
      <Section>
        <GridWrapper>
          <div className="grid gap-16 lg:gap-24">
            <div className="flex flex-col gap-6">
              {service.fullDescription ? (
                <PortableText value={service.fullDescription as any} />
              ) : null}
            </div>
          </div>
        </GridWrapper>
      </Section>

      {/* ── Process / Approach ── */}
      {(service.process?.length ?? 0) > 0 && (
        <Section background="surface">
          <GridWrapper>
            <FadeUp>
              <p className="mb-12 text-label text-stone">HOW WE WORK</p>
            </FadeUp>
            <div className="flex flex-col">
              {service.process?.map((step, i) => (
                <FadeUp key={i} delay={i * 80}>
                  <div className="grid grid-cols-[2rem_1fr] gap-8 border-b border-border py-8">
                    <span className="pt-1 text-label text-threshold">0{i + 1}</span>
                    <div className="flex flex-col gap-2">
                      <h3 className="text-body font-semibold text-paper">{step.title}</h3>
                      <p className="text-body text-stone">{step.description}</p>
                    </div>
                  </div>
                </FadeUp>
              ))}
            </div>
          </GridWrapper>
        </Section>
      )}

      {/* ── Related Projects ── */}
      {relatedProjects.length > 0 && (
        <Section>
          <GridWrapper>
            <FadeUp>
              <p className="mb-12 text-label text-stone">RELATED PROJECTS</p>
            </FadeUp>
            <div className="grid gap-8 sm:grid-cols-2">
              {relatedProjects.map((project) => (
                <FadeUp key={project.slug}>
                  <Link
                    href={`/en/projects/${project.slug}`}
                    className="group flex gap-6 border border-border p-6 transition-colors duration-fast ease-smooth hover:border-paper"
                  >
                    <div className="h-24 w-32 flex-shrink-0 overflow-hidden">
                      <img
                        src={heroImage(project.imageId)}
                        alt={project.title}
                        className="h-full w-full object-cover transition-transform duration-medium ease-smooth group-hover:scale-[1.05]"
                      />
                    </div>
                    <div className="flex flex-col justify-center gap-1">
                      <p className="text-label text-paper">{project.title}</p>
                      <p className="text-body text-stone">{project.location}</p>
                      <p className="mt-2 text-label text-threshold transition-colors duration-fast ease-smooth group-hover:text-paper">
                        VIEW →
                      </p>
                    </div>
                  </Link>
                </FadeUp>
              ))}
            </div>
          </GridWrapper>
        </Section>
      )}

      {/* ── FAQ ── */}
      {(service.faq?.length ?? 0) > 0 && (
        <Section background="surface">
          <GridWrapper>
            <FadeUp>
              <p className="mb-12 text-label text-stone">FREQUENTLY ASKED</p>
            </FadeUp>
            <Accordion
              items={(service.faq || []).map(f => ({
                question: f.question,
                answer: <PortableText value={f.answer as any} />
              }))}
            />
          </GridWrapper>
        </Section>
      )}

      {/* ── CTA ── */}
      <Section>
        <GridWrapper>
          <FadeUp>
            <div className="flex flex-col items-start gap-8">
              <TextReveal tag="h2" className="max-w-xl text-display-md text-paper">
                READY TO GET STARTED?
              </TextReveal>
              <GhostButton href="/contact">Discuss Your Project</GhostButton>
            </div>
          </FadeUp>
        </GridWrapper>
      </Section>
    </main>
  );
}
