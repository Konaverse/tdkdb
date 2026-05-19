import type { Metadata } from 'next';
import { heroImage, teamPhoto } from '@/lib/cloudinary/transforms';
import Image from 'next/image';
import Section from '@/components/layout/Section';
import GridWrapper from '@/components/layout/GridWrapper';
import TextReveal from '@/components/animations/TextReveal';
import FadeUp from '@/components/animations/FadeUp';
import CountUp from '@/components/animations/CountUp';
import StaggerGroup from '@/components/animations/StaggerGroup';
import { GhostButton } from '@/components/ui/Button';
import { getAllTeamMembers } from '@/lib/sanity/queries';

export const metadata: Metadata = {
  title: 'About | TDK Design & Build',
  description:
    'TDK Design & Build — a real estate developer in Greece crafting thoughtful residential and commercial spaces for over 15 years.',
};

export const revalidate = 60;

export default async function AboutPage() {
  const teamMembers = await getAllTeamMembers();

  return (
    <main className="bg-void text-paper">
      {/* ── Hero ── */}
      <section className="relative flex min-h-[70vh] items-end pb-24">
        <Image
          src={heroImage('clients/tdkdb/general/about/armonia_front_angle_day')}
          alt=""
          aria-hidden="true"
          fill
          className="object-cover"
          style={{ opacity: 0.2 }}
        />
        <div className="via-void/60 absolute inset-0 bg-gradient-to-t from-void to-transparent" />
        <GridWrapper className="relative z-10">
          <p className="mb-4 text-label text-stone">WHO WE ARE</p>
          <TextReveal tag="h1" className="max-w-3xl text-display-lg text-paper">
            BUILDING WITH PURPOSE. DESIGNING FOR LIFE.
          </TextReveal>
        </GridWrapper>
      </section>
      {/* ── Our Story ── */}
      <Section>
        <GridWrapper>
          <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
            <FadeUp>
              <p className="text-display-md leading-tight text-threshold">
                &ldquo;Every structure we raise is a commitment to the people who will live inside
                it.&rdquo;
              </p>
            </FadeUp>
            <div className="flex flex-col gap-6">
              <FadeUp delay={100}>
                <p className="text-body-lg text-stone">
                  TDK Design &amp; Build was founded on a simple belief: that architecture should
                  serve life, not the other way around. From our first project in Nicosia to our
                  growing portfolio across Cyprus, we have held that principle at the centre of
                  everything we do.
                </p>
              </FadeUp>
              <FadeUp delay={200}>
                <p className="text-body-lg text-stone">
                  We are a fully integrated studio — architects, construction managers, and interior
                  designers working under one roof. This seamless collaboration means fewer
                  handoffs, more coherence, and a finished result that feels intentional at every
                  level.
                </p>
              </FadeUp>
              <FadeUp delay={300}>
                <p className="text-body-lg text-stone">
                  Our work spans curated residential developments, bespoke private homes, and
                  mixed-use spaces. Whether you are investing in a completed unit or partnering with
                  us from the ground up, you receive the same level of care and craftsmanship.
                </p>
              </FadeUp>
            </div>
          </div>
        </GridWrapper>
      </Section>

      {/* ── Mission & Vision ── */}
      <Section background="surface">
        <GridWrapper>
          <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
            <FadeUp>
              <p className="mb-4 text-label text-stone">OUR MISSION</p>
              <TextReveal tag="h2" className="text-display-md text-paper">
                TO ELEVATE THE STANDARD OF BUILT LIFE IN CYPRUS.
              </TextReveal>
            </FadeUp>
            <FadeUp delay={150}>
              <p className="mb-4 text-label text-stone">OUR VISION</p>
              <TextReveal tag="h2" className="text-display-md text-threshold" delay={150}>
                SPACES THAT ENDURE, DETAILS THAT MATTER.
              </TextReveal>
            </FadeUp>
          </div>
        </GridWrapper>
      </Section>

      {/* ── Numbers ── */}
      <Section>
        <GridWrapper>
          <StaggerGroup className="grid grid-cols-1 gap-12 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <span className="text-display-md text-threshold">
                <CountUp target={8} suffix="+" />
              </span>
              <span className="text-label text-stone">Projects Delivered</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-display-md text-threshold">
                <CountUp target={15} suffix="+" />
              </span>
              <span className="text-label text-stone">Years of Experience</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-display-md text-threshold">
                <CountUp target={100} suffix="%" />
              </span>
              <span className="text-label text-stone">Client Retention</span>
            </div>
          </StaggerGroup>
        </GridWrapper>
      </Section>

      {/* ── Team ── */}
      <Section background="surface">
        <GridWrapper>
          <FadeUp>
            <p className="mb-4 text-label text-stone">THE TEAM</p>
            <h2 className="mb-16 text-heading text-paper">The People Behind the Work</h2>
          </FadeUp>
          <StaggerGroup className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {teamMembers.map((member) => (
              <div key={member.name} className="group flex flex-col gap-4">
                <div className="aspect-square w-full overflow-hidden bg-void relative">
                  {member.photoId ? (
                    <img
                      src={teamPhoto(member.photoId)}
                      alt={member.name}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-medium ease-smooth group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-surface to-void transition-transform duration-medium ease-smooth group-hover:scale-[1.03]" />
                  )}
                </div>
                <div>
                  <p className="mb-1 text-label transition-colors duration-fast ease-smooth group-hover:text-threshold">
                    {member.name}
                  </p>
                  <p className="text-body text-stone">{member.role}</p>
                </div>
                <p className="text-body text-stone">{member.bio}</p>
              </div>
            ))}
          </StaggerGroup>
        </GridWrapper>
      </Section>

      {/* ── CTA ── */}
      <Section>
        <GridWrapper>
          <FadeUp>
            <div className="flex flex-col items-start gap-8">
              <TextReveal tag="h2" className="max-w-xl text-display-md text-paper">
                READY TO BUILD? LET&apos;S TALK.
              </TextReveal>
              <GhostButton href="/contact">Get in Touch</GhostButton>
            </div>
          </FadeUp>
        </GridWrapper>
      </Section>
    </main>
  );
}
