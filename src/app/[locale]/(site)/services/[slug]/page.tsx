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

interface ServiceData {
  name: string;
  heroTagline: string;
  pullQuote: string;
  description: string[];
  processSteps: { heading: string; description: string }[];
  relatedProjectSlugs: string[];
  faqs: { question: string; answer: string }[];
}

const services: Record<string, ServiceData> = {
  'architecture-design': {
    name: 'Architecture & Design',
    heroTagline: 'SPACE SHAPED WITH INTENTION.',
    pullQuote:
      'Architecture is not about buildings. It is about the experiences those buildings make possible.',
    description: [
      'Our architecture practice begins with listening. Every brief is unique, every site has its own character, and every client brings a distinct set of needs and aspirations. We start by understanding all three.',
      'From initial sketches through to construction documentation, our design team applies a rigorous process that balances aesthetic ambition with technical precision. We do not design for awards — we design for life.',
      'Sustainability runs through every decision. Orientation, material selection, passive ventilation, and daylighting strategies are integrated from the first concept, not added as afterthoughts.',
    ],
    processSteps: [
      {
        heading: 'Site Analysis',
        description:
          'Topographic survey, solar study, views, access, and planning constraints mapped before a line is drawn.',
      },
      {
        heading: 'Concept Design',
        description:
          'Spatial organisation, massing, and character explored through sketches, models, and reference studies.',
      },
      {
        heading: 'Developed Design',
        description:
          'Scheme refined with structural engineer and MEP consultant input. Materials and finishes defined.',
      },
      {
        heading: 'Technical Documentation',
        description: 'Full construction drawings, specifications, and schedules for tender.',
      },
      {
        heading: 'Construction Support',
        description:
          'Site inspections, RFI responses, and design clarifications throughout the build.',
      },
    ],
    relatedProjectSlugs: ['armonia', 'almond'],
    faqs: [
      {
        question: 'Do you work on projects outside Cyprus?',
        answer:
          'Our primary focus is Cyprus and Greece, but we welcome enquiries from further afield for the right project.',
      },
      {
        question: 'Can I commission just the architecture without construction management?',
        answer:
          'Yes. We offer architecture as a standalone service, though integrated delivery typically produces better results.',
      },
      {
        question: 'How long does the design phase take?',
        answer:
          'A typical residential design phase runs 3–6 months from brief to planning submission, depending on complexity.',
      },
      {
        question: 'Do you handle planning permission?',
        answer:
          'Yes — we prepare and submit all planning applications and liaise with local authorities on your behalf.',
      },
    ],
  },

  'construction-management': {
    name: 'Construction Management',
    heroTagline: 'BUILT TO LAST. DELIVERED ON TIME.',
    pullQuote: 'Quality is not an accident. It is the result of relentless attention, every day.',
    description: [
      'Construction management is where vision meets reality — and where the gap between the two is either closed or allowed to widen. Our site teams exist to close it.',
      'We manage every contractor, every delivery, every inspection. Cost control, programme tracking, and quality assurance run in parallel throughout the project. You receive weekly progress reports and have direct access to your project manager at all times.',
      'Our in-house team brings decades of experience on residential and commercial builds across Cyprus. We know the local supply chain, the regulatory landscape, and — critically — where problems are most likely to arise and how to preempt them.',
    ],
    processSteps: [
      {
        heading: 'Pre-Construction',
        description: 'Tender packages issued, contractors evaluated, programme established.',
      },
      {
        heading: 'Mobilisation',
        description:
          'Site set-up, utilities connected, welfare facilities in place, method statements approved.',
      },
      {
        heading: 'Structure & Envelope',
        description:
          'Foundation, frame, roof, and external works managed against programme and budget.',
      },
      {
        heading: 'Fit-Out',
        description:
          'MEP first and second fix, internal linings, finishes, and equipment installation.',
      },
      {
        heading: 'Completion & Handover',
        description: 'Snagging, building control sign-off, and keys handed to client.',
      },
    ],
    relatedProjectSlugs: ['armonia', 'almond'],
    faqs: [
      {
        question: 'Do you use your own construction crews or subcontract?',
        answer:
          'We use a vetted network of specialist subcontractors, with our project managers on site daily.',
      },
      {
        question: 'How do you handle cost overruns?',
        answer:
          'We establish a detailed cost plan at tender stage and track actuals weekly. Variations require written approval before proceeding.',
      },
      {
        question: 'What construction standards do you build to?',
        answer:
          'All our projects comply with Cyprus building regulations and, where appropriate, Eurocodes for structural design.',
      },
      {
        question: 'Can you manage a project designed by another architect?',
        answer: 'Yes — we regularly step in as construction manager on externally designed projects.',
      },
    ],
  },

  'interior-design': {
    name: 'Interior Design',
    heroTagline: 'EVERY ROOM TELLS A STORY.',
    pullQuote:
      'The best interiors are invisible — they simply feel like the space you were always meant to inhabit.',
    description: [
      'Interior design at TDK is not decoration applied on top of architecture. It is embedded in the process from the start, shaping spatial sequences, material relationships, and the quality of light before a single piece of furniture is specified.',
      'Our interior design team works across all scales — from the choice of a single door handle to the layout of an entire apartment. Every decision is made in the context of the whole, and every material is selected for how it will age.',
      'We produce full interior design packages including mood boards, material and finish schedules, furniture layouts, bespoke joinery drawings, and lighting design. We also manage procurement and installation where required.',
    ],
    processSteps: [
      {
        heading: 'Design Vision',
        description:
          'Mood boards, material direction, and reference imagery agreed with client before specification begins.',
      },
      {
        heading: 'Spatial Layout',
        description:
          'Furniture layouts, circulation, and built-in joinery positions resolved in plan and 3D.',
      },
      {
        heading: 'Material & Finish Specification',
        description:
          'Full schedule of flooring, wall finishes, fixtures, fittings, and hardware with supplier references.',
      },
      {
        heading: 'Lighting Design',
        description:
          'Layered lighting scheme: ambient, task, and accent. Fixture selection and switching strategy.',
      },
      {
        heading: 'Procurement & Installation',
        description: 'Supplier orders placed, deliveries coordinated, and installation supervised.',
      },
    ],
    relatedProjectSlugs: ['armonia'],
    faqs: [
      {
        question: 'Do you offer interior design as a standalone service?',
        answer:
          'Yes — we work on interiors independently of the broader build for refurbishments and fit-outs.',
      },
      {
        question: 'Do you have a signature style?',
        answer:
          'We design in response to each project rather than imposing a house style. Our work tends toward refined minimalism, but we follow the brief.',
      },
      {
        question: 'Can you source furniture internationally?',
        answer:
          'Yes. We work with suppliers across Europe and beyond, managing logistics to site.',
      },
      {
        question: 'Do you do show apartments?',
        answer:
          'Yes — show apartments are a specialty, and we have delivered several for residential developments.',
      },
    ],
  },

  'project-management': {
    name: 'Project Management',
    heroTagline: 'ONE TEAM. END TO END.',
    pullQuote:
      'Complexity managed well becomes invisible. That invisibility is what we are here to create.',
    description: [
      'Project management is about accountability. When TDK acts as your project manager, we become your single point of contact across every discipline — architecture, structural engineering, MEP, construction, and interior design.',
      'We track programme, cost, and quality simultaneously. Weekly reports, monthly financial reconciliations, and regular client meetings keep you informed without overwhelming you. You get the full picture when you want it, and a summary when you do not.',
      'Our value is in preempting problems before they become cost events. Twenty years of delivering buildings in Cyprus means we know where the surprises tend to happen — and how to plan around them.',
    ],
    processSteps: [
      {
        heading: 'Project Inception',
        description: 'Scope defined, programme established, team assembled, brief documented.',
      },
      {
        heading: 'Design Management',
        description:
          'Design team coordinated, information release schedule maintained, consultant appointments managed.',
      },
      {
        heading: 'Procurement',
        description: 'Tender strategy agreed, packages issued, bids evaluated, contracts placed.',
      },
      {
        heading: 'Construction Monitoring',
        description: 'Progress, cost, and quality tracked weekly. Risks logged and managed.',
      },
      {
        heading: 'Closeout',
        description:
          'Commissioning, testing, O&M documentation collated, defects liability managed.',
      },
    ],
    relatedProjectSlugs: ['armonia', 'almond'],
    faqs: [
      {
        question: 'What size projects do you manage?',
        answer:
          'We manage projects from €500k to €10m+. Scale affects complexity but not the rigour we bring.',
      },
      {
        question: 'Do you manage public sector projects?',
        answer:
          'Our focus is private sector residential and commercial, though we have experience on publicly funded schemes.',
      },
      {
        question: 'How do you charge for project management?',
        answer:
          'Typically a percentage of construction cost, agreed at appointment. We can discuss fixed fee structures for smaller projects.',
      },
      {
        question: 'Can you join a project that has already started?',
        answer:
          'Yes — we have stepped into projects mid-stream on several occasions. An audit of programme and cost is the first step.',
      },
    ],
  },
};

const relatedProjectData: Record<string, { title: string; location: string; imageId: string }> = {
  armonia: {
    title: 'ARMONIA',
    location: 'Lakatameia, Nicosia',
    imageId: 'clients/tdkdb/armonia/exterior/armonia_front_angle_day',
  },
  almond: {
    title: 'ALMOND',
    location: 'Nicosia',
    imageId: 'clients/tdkdb/almond/renders/almond_front_angle_day',
  },
};

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = services[slug];
  if (!service) return {};
  return {
    title: `${service.name} | TDK Design & Build`,
    description: service.description[0],
  };
}

export async function generateStaticParams() {
  return Object.keys(services).map((slug) => ({ slug }));
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  const service = services[slug];
  if (!service) notFound();

  const relatedProjects = service.relatedProjectSlugs
    .map((s) => ({ slug: s, ...relatedProjectData[s] }))
    .filter((p) => p.title);

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
        <div className="absolute inset-0 bg-gradient-to-t from-void via-void/60 to-transparent" />
        <GridWrapper className="relative z-10">
          <p className="text-label mb-4 text-threshold">SERVICE</p>
          <TextReveal tag="h1" className="text-display-lg max-w-3xl text-paper">
            {service.heroTagline}
          </TextReveal>
          <p className="mt-4 text-heading font-light text-stone">{service.name}</p>
        </GridWrapper>
      </section>

      {/* ── Description ── */}
      <Section>
        <GridWrapper>
          <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
            <FadeUp>
              <p className="text-display-md leading-tight text-threshold">
                &ldquo;{service.pullQuote}&rdquo;
              </p>
            </FadeUp>
            <div className="flex flex-col gap-6">
              {service.description.map((para, i) => (
                <FadeUp key={i} delay={i * 100}>
                  <p className="text-body-lg text-stone">{para}</p>
                </FadeUp>
              ))}
            </div>
          </div>
        </GridWrapper>
      </Section>

      {/* ── Process / Approach ── */}
      <Section background="surface">
        <GridWrapper>
          <FadeUp>
            <p className="text-label mb-12 text-stone">HOW WE WORK</p>
          </FadeUp>
          <div className="flex flex-col">
            {service.processSteps.map((step, i) => (
              <FadeUp key={i} delay={i * 80}>
                <div className="grid grid-cols-[2rem_1fr] gap-8 border-b border-border py-8">
                  <span className="text-label pt-1 text-threshold">0{i + 1}</span>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-body font-semibold text-paper">{step.heading}</h3>
                    <p className="text-body text-stone">{step.description}</p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </GridWrapper>
      </Section>

      {/* ── Related Projects ── */}
      {relatedProjects.length > 0 && (
        <Section>
          <GridWrapper>
            <FadeUp>
              <p className="text-label mb-12 text-stone">RELATED PROJECTS</p>
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
                      <p className="text-label mt-2 text-threshold transition-colors duration-fast ease-smooth group-hover:text-paper">
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
      <Section background="surface">
        <GridWrapper>
          <FadeUp>
            <p className="text-label mb-12 text-stone">FREQUENTLY ASKED</p>
          </FadeUp>
          <Accordion items={service.faqs} />
        </GridWrapper>
      </Section>

      {/* ── CTA ── */}
      <Section>
        <GridWrapper>
          <FadeUp>
            <div className="flex flex-col items-start gap-8">
              <TextReveal tag="h2" className="text-display-md max-w-xl text-paper">
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
