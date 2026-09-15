import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import ProjectHero from '@/components/sections/project/ProjectHero';
import ProjectScenes from '@/components/sections/project/ProjectScenes';
import ProjectAvailability from '@/components/sections/project/ProjectAvailability';
import ProjectStory from '@/components/sections/project/ProjectStory';
import ProjectRegister from '@/components/sections/project/ProjectRegister';
import { getProjectBySlug, getAllProjects } from '@/lib/sanity/queries';
import { bedroomsLabel, displayTitle, sceneImages } from '@/lib/projects/display';
import type { PortableTextBlock } from '@/lib/sanity/types';

export const revalidate = 60;

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return {};

  return {
    title: project.seo?.title || `${project.title} | TDK Design & Build`,
    description: project.seo?.description || project.pullQuote || '',
  };
}

export async function generateStaticParams() {
  const projects = await getAllProjects();
  return projects.map((p) => ({ slug: p.slug.current }));
}

/** Plain paragraphs out of Portable Text blocks. */
function paragraphsOf(blocks: PortableTextBlock[] = []): string[] {
  return blocks
    .filter((b) => b._type === 'block' && Array.isArray(b.children))
    .map((b) => (b.children as { text?: string }[]).map((c) => c.text ?? '').join(''))
    .map((t) => t.trim())
    .filter(Boolean);
}

/* The page, in the order the reader needs it: the building, the pictures,
   what is available, what it is and how far along, and the form. */
export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const title = displayTitle(project);
  const images = sceneImages(project, 5);
  const units = project.units ?? [];
  const soldOut = units.length > 0 && units.every((u) => u.status === 'sold');

  const preferences = Array.from(
    new Set(units.filter((u) => u.status === 'available').map((u) => bedroomsLabel(u.unitType))),
  );

  const heading =
    project.interestFormHeading?.trim() ||
    (soldOut ? 'Looking for a home like this?' : 'Register your interest');
  const intro =
    project.interestFormSubtext?.trim() ||
    (soldOut
      ? `Every residence at ${title} is sold. Tell us what you are looking for and we will write when the next one opens.`
      : `Leave your details and we will send you plans, prices and availability for ${title}.`);

  return (
    <main style={{ background: '#ffffff', color: '#111111' }}>
      {/* Full bleed. Arriving from the homepage, this is where the project's
          photograph lands (see ProjectTransition). */}
      <ProjectHero project={project} />

      {images.length > 0 && (
        <ProjectScenes
          title={title}
          images={images}
          quote={project.pullQuote}
          features={project.features}
        />
      )}

      {units.length > 0 && <ProjectAvailability units={units} note={project.unitsNote} />}

      <ProjectStory
        paragraphs={paragraphsOf(project.description)}
        progress={
          typeof project.progressPercent === 'number'
            ? { percent: project.progressPercent, label: project.progressLabel }
            : undefined
        }
        milestone={{
          label: project.status === 'completed' ? 'Completed' : 'Delivery',
          value: String(project.year),
        }}
        specs={project.specs ?? []}
      />

      <ProjectRegister
        projectSlug={project.slug.current}
        projectName={project.title}
        heading={heading}
        intro={intro}
        preferences={preferences}
      />
    </main>
  );
}
