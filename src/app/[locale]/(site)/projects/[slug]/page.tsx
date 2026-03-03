import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProjectHero from '@/components/sections/project/ProjectHero';
import ProjectOverviewBar from '@/components/sections/project/ProjectOverviewBar';
import ProjectRendersGallery from '@/components/sections/project/ProjectRendersGallery';
import ProjectPhotosGallery from '@/components/sections/project/ProjectPhotosGallery';
import ProjectDescription from '@/components/sections/project/ProjectDescription';
import ProjectSpecs from '@/components/sections/project/ProjectSpecs';
import ProjectProgress from '@/components/sections/project/ProjectProgress';
import ProjectUnitsTable from '@/components/sections/project/ProjectUnitsTable';
import ProjectInterestForm from '@/components/sections/project/ProjectInterestForm';
import ProjectLocation from '@/components/sections/project/ProjectLocation';
import ProjectRelated from '@/components/sections/project/ProjectRelated';
import ProjectCTA from '@/components/sections/project/ProjectCTA';
import type { ProjectUnit } from '@/components/sections/project/ProjectUnitsTable';
import { getProjectBySlug, getAllProjects } from '@/lib/sanity/queries';

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

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) notFound();

  const showProgress =
    project.ctaType !== 'showcase' &&
    project.status !== 'completed' &&
    project.progressPercent !== undefined;

  const showInterestForm = project.ctaType === 'register-interest';

  // Format overview items dynamically from project fields
  const overviewItems = [
    { label: 'TYPE', value: project.type.charAt(0).toUpperCase() + project.type.slice(1) },
    { label: 'LOCATION', value: project.location },
    { label: project.status === 'completed' ? 'COMPLETED' : 'DELIVERY', value: String(project.year) },
    { label: 'STATUS', value: project.status },
  ];

  // Helper to extract text from PortableText blocks purely for the fallback description body
  const extractText = (blocks: any[]) => {
    return blocks
      .filter((block) => block._type === 'block' && block.children)
      .map((block) => block.children.map((child: any) => child.text).join(''));
  };

  const descriptionBody = project.description ? extractText(project.description) : [];

  // Map units to the exact component props manually to ensure types always align
  const mappedUnits = project.units?.map((u) => ({
    floor: u.floor,
    type: u.unitType,
    area: `${u.sizeM2} m²`,
    price: '—', // Hardcoded for now based on previous UI mock
    status: u.status,
  })) || [];

  // Map related projects
  const relatedProjects = (project.relatedProjectSlugs || []).map((relatedSlug) => ({
    // Note: To display full rich related cards, we'd need GROQ projection for this nested data.
    // For now, based on prompt 6.3 specs, we map to strings. 
    // Ideally this query would be expanded in queries.ts, but let's just pass minimal shape.
    slug: relatedSlug,
    title: relatedSlug.toUpperCase(),
    location: '',
    imageId: '',
  }));

  return (
    <main className="bg-void text-paper">
      <ProjectHero
        title={project.title}
        location={project.location}
        status={project.status}
        year={project.year}
        heroImageId={project.heroImageId}
      />

      <ProjectOverviewBar items={overviewItems} />

      <ProjectDescription title={project.pullQuote || 'OVERVIEW'} body={descriptionBody} />

      {project.rendersGallery && project.rendersGallery.images?.length > 0 && (
        <ProjectRendersGallery
          heading={project.rendersGallery.heading}
          images={project.rendersGallery.images}
        />
      )}

      {showProgress && project.progressPercent !== undefined && (
        <ProjectProgress percent={project.progressPercent} label={project.progressLabel ?? ''} />
      )}

      {project.photosGallery && project.photosGallery.images?.length > 0 && (
        <ProjectPhotosGallery
          heading={project.photosGallery.heading}
          images={project.photosGallery.images}
        />
      )}

      {(project.specs?.length ?? 0) > 0 && (
        <ProjectSpecs
          specs={project.specs?.map(s => ({ label: s.key, value: s.value })) || []}
        />
      )}

      {mappedUnits.length > 0 && <ProjectUnitsTable units={mappedUnits} />}

      {showInterestForm && (
        <ProjectInterestForm projectSlug={project.slug.current} projectName={project.title} />
      )}

      {project.mapEmbedUrl && <ProjectLocation address={project.mapEmbedUrl || project.location} />}

      {relatedProjects.length > 0 && <ProjectRelated projects={relatedProjects} />}

      <ProjectCTA ctaType={project.ctaType} />
    </main>
  );
}
