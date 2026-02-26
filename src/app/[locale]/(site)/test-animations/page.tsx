import Section from '@/components/layout/Section';
import GridWrapper from '@/components/layout/GridWrapper';
import Divider from '@/components/layout/Divider';
import FadeUp from '@/components/animations/FadeUp';
import TextReveal from '@/components/animations/TextReveal';
import StaggerGroup from '@/components/animations/StaggerGroup';
import CountUp from '@/components/animations/CountUp';
import HorizontalReveal from '@/components/animations/HorizontalReveal';

export default function TestAnimationsPage() {
  return (
    <>
      {/* ── Hero spacer (scroll prompt) ───────────────────────────────────── */}
      <Section>
        <GridWrapper className="flex h-[60vh] flex-col justify-end pb-16">
          <p className="text-label text-stone">Phase 3.4 — 3.5 · Scroll to verify components</p>
          <TextReveal tag="h1" className="text-display-xl text-paper">
            Layout & Animation
          </TextReveal>
          <TextReveal tag="p" delay={200} className="mt-4 text-body text-stone">
            GridWrapper · Section · Divider · FadeUp · TextReveal · StaggerGroup · CountUp ·
            HorizontalReveal
          </TextReveal>
        </GridWrapper>
      </Section>

      <Divider />

      {/* ── 1. Section backgrounds ────────────────────────────────────────── */}
      <Section background="surface">
        <GridWrapper>
          <FadeUp>
            <p className="text-label text-stone">Section — background: surface</p>
          </FadeUp>
          <FadeUp delay={120}>
            <p className="mt-4 text-body-lg text-paper">
              This section uses <code className="text-mono text-threshold">bg-surface</code>{' '}
              (#1a1a1a). The Section component applies{' '}
              <code className="text-mono text-threshold">py-section</code> (clamp 80–160px) vertical
              padding automatically.
            </p>
          </FadeUp>
        </GridWrapper>
      </Section>

      <Divider delay={200} />

      <Section background="void">
        <GridWrapper>
          <FadeUp>
            <p className="text-label text-stone">Section — background: void</p>
          </FadeUp>
          <FadeUp delay={120}>
            <p className="mt-4 text-body-lg text-paper">
              This section uses <code className="text-mono text-threshold">bg-void</code> (#0d0d0d),
              the default background.
            </p>
          </FadeUp>
        </GridWrapper>
      </Section>

      <Divider />

      {/* ── 2. GridWrapper fluid padding ─────────────────────────────────── */}
      <Section background="surface">
        <GridWrapper>
          <FadeUp>
            <p className="text-label text-stone">GridWrapper — fluid padding</p>
          </FadeUp>
          <FadeUp delay={100}>
            <p className="mt-4 text-body text-stone">
              Horizontal padding is{' '}
              <code className="text-mono text-threshold">clamp(24px, 5vw, 80px)</code>. Resize the
              window to see it scale. Max-width is{' '}
              <code className="text-mono text-threshold">1440px</code>.
            </p>
          </FadeUp>
          {/* Visual padding indicator */}
          <FadeUp delay={200} className="mt-8">
            <div className="h-2 w-full bg-threshold opacity-30" />
            <p className="mt-2 text-label text-stone">↑ content edge</p>
          </FadeUp>
        </GridWrapper>
      </Section>

      <Divider />

      {/* ── 3. TextReveal ─────────────────────────────────────────────────── */}
      <Section>
        <GridWrapper className="space-y-6">
          <p className="text-label text-stone">TextReveal — clip-path sweep</p>
          <TextReveal tag="h2" className="text-display-lg text-paper">
            Architecture with intention.
          </TextReveal>
          <TextReveal tag="h3" delay={150} className="text-display-md text-paper">
            Every surface has a purpose.
          </TextReveal>
          <TextReveal tag="p" delay={300} className="max-w-text text-body text-stone">
            Body text revealed left-to-right with clip-path animation. The mask slides away to
            uncover the content beneath.
          </TextReveal>
        </GridWrapper>
      </Section>

      <Divider delay={100} />

      {/* ── 4. StaggerGroup ──────────────────────────────────────────────── */}
      <Section background="surface">
        <GridWrapper>
          <FadeUp>
            <p className="text-label text-stone">StaggerGroup — viewport trigger</p>
          </FadeUp>
          <StaggerGroup className="mt-10 grid grid-cols-2 gap-px bg-border lg:grid-cols-4">
            {['Design', 'Build', 'Deliver', 'Last'].map((word) => (
              <div key={word} className="flex flex-col justify-between bg-surface p-8">
                <p className="text-label text-stone">0{['Design', 'Build', 'Deliver', 'Last'].indexOf(word) + 1}</p>
                <p className="mt-12 text-display-md text-paper">{word}</p>
              </div>
            ))}
          </StaggerGroup>
        </GridWrapper>
      </Section>

      <Divider />

      {/* ── 5. CountUp ───────────────────────────────────────────────────── */}
      <Section>
        <GridWrapper>
          <FadeUp>
            <p className="text-label text-stone">CountUp — GSAP counter</p>
          </FadeUp>
          <div className="mt-12 grid grid-cols-2 gap-12 lg:grid-cols-4">
            {[
              { target: 48, suffix: '+', label: 'Projects' },
              { target: 12, suffix: ' yrs', label: 'Experience', duration: 1600 },
              { target: 3200, suffix: ' m²', label: 'Built Area', duration: 2400 },
              { target: 100, suffix: '%', label: 'Satisfaction', duration: 1800 },
            ].map(({ target, suffix, label, duration }) => (
              <div key={label} className="space-y-2">
                <CountUp
                  target={target}
                  suffix={suffix}
                  duration={duration ?? 2000}
                  className="text-display-lg text-paper"
                />
                <p className="text-label text-stone">{label}</p>
              </div>
            ))}
          </div>
        </GridWrapper>
      </Section>

      <Divider delay={100} />

      {/* ── 6. HorizontalReveal ──────────────────────────────────────────── */}
      <Section background="surface">
        <GridWrapper>
          <FadeUp>
            <p className="text-label text-stone">HorizontalReveal — left & right</p>
          </FadeUp>
          <div className="mt-10 grid grid-cols-1 gap-px bg-border lg:grid-cols-2">
            <HorizontalReveal direction="left">
              <div className="bg-surface p-10">
                <p className="text-label text-stone">From Left</p>
                <p className="mt-4 text-body-lg text-paper">
                  Slides in 60px from the left with a simultaneous fade over 1000ms.
                </p>
              </div>
            </HorizontalReveal>
            <HorizontalReveal direction="right">
              <div className="bg-surface p-10">
                <p className="text-label text-stone">From Right</p>
                <p className="mt-4 text-body-lg text-paper">
                  Slides in 60px from the right with a simultaneous fade over 1000ms.
                </p>
              </div>
            </HorizontalReveal>
          </div>
        </GridWrapper>
      </Section>

      <Divider />

      {/* ── 7. FadeUp variants ───────────────────────────────────────────── */}
      <Section>
        <GridWrapper className="space-y-6">
          <p className="text-label text-stone">FadeUp — delay & distance variants</p>
          <FadeUp>
            <p className="text-body text-paper">Default — 0ms delay, 40px distance</p>
          </FadeUp>
          <FadeUp delay={200}>
            <p className="text-body text-paper">200ms delay</p>
          </FadeUp>
          <FadeUp delay={400} distance={80}>
            <p className="text-body text-paper">400ms delay, 80px distance</p>
          </FadeUp>
          <FadeUp delay={600} duration={1400}>
            <p className="text-body text-paper">600ms delay, 1400ms duration</p>
          </FadeUp>
        </GridWrapper>
      </Section>

      <Divider />

      {/* ── End ─────────────────────────────────────────────────────────── */}
      <Section>
        <GridWrapper>
          <TextReveal tag="p" className="text-label text-stone">
            End of component test — all checks pass.
          </TextReveal>
        </GridWrapper>
      </Section>
    </>
  );
}
