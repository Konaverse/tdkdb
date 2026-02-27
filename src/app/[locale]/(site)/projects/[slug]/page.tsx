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

type ProjectStatus = 'completed' | 'in-progress' | 'upcoming';
type CTAType = 'showcase' | 'register-interest' | 'contact';

interface ProjectData {
  slug: string;
  title: string;
  location: string;
  address: string;
  category: string;
  status: ProjectStatus;
  ctaType: CTAType;
  year: number;
  heroImageId: string;
  overviewItems: { label: string; value: string }[];
  description: { title: string; body: string[] };
  specs: { label: string; value: string }[];
  rendersGallery: { heading: string; images: string[] };
  photosGallery: { heading: string; images: string[] };
  progressPercent?: number;
  progressLabel?: string;
  units: ProjectUnit[];
}

const projects: Record<string, ProjectData> = {
  armonia: {
    slug: 'armonia',
    title: 'ARMONIA',
    location: 'Lakatameia, Nicosia',
    address: 'Lakatameia, Nicosia, Cyprus',
    category: 'Residential',
    status: 'completed',
    ctaType: 'showcase',
    year: 2024,
    heroImageId: 'clients/tdkdb/armonia/exterior/armonia_front_angle_day',
    overviewItems: [
      { label: 'TYPE', value: 'Residential Development' },
      { label: 'LOCATION', value: 'Lakatameia, Nicosia' },
      { label: 'COMPLETED', value: '2024' },
      { label: 'UNITS', value: '6 Apartments' },
      { label: 'STATUS', value: 'Completed' },
    ],
    description: {
      title: 'ARCHITECTURE THAT BELONGS.',
      body: [
        'Armonia is a six-unit residential development in Lakatameia, designed around the idea that a building should feel native to its surroundings from the first day of occupation.',
        'The architecture draws on the Mediterranean tradition of white rendered surfaces, deep shade, and generous outdoor living — translated through a contemporary lens that prioritises material honesty and long-term durability.',
        'Every apartment features floor-to-ceiling glazing, private balconies that read as extensions of the living floor, and a rooftop terrace with views across Lakatameia toward the Pentadaktylos mountains.',
      ],
    },
    specs: [
      { label: 'SITE AREA', value: '650 m²' },
      { label: 'BUILT AREA', value: '1,200 m²' },
      { label: 'FLOORS', value: '4 storeys + rooftop' },
      { label: 'PARKING', value: 'Covered, 1 space per unit' },
      { label: 'ENERGY CLASS', value: 'A' },
      { label: 'STRUCTURE', value: 'Reinforced concrete' },
    ],
    rendersGallery: {
      heading: 'THE VISION',
      images: [
        'clients/tdkdb/armonia/exterior/armonia_front_angle_day',
        'clients/tdkdb/armonia/exterior/1',
        'clients/tdkdb/armonia/exterior/2',
        'clients/tdkdb/armonia/exterior/3',
      ],
    },
    photosGallery: {
      heading: 'COMPLETED',
      images: [
        'clients/tdkdb/armonia/interior/2',
        'clients/tdkdb/armonia/interior/3',
        'clients/tdkdb/armonia/interior/4',
        'clients/tdkdb/armonia/interior/5',
        'clients/tdkdb/armonia/interior/6',
      ],
    },
    units: [
      { type: 'Apartment A1', area: '85 m²', floor: 'Ground', price: '—', status: 'sold' },
      { type: 'Apartment A2', area: '92 m²', floor: 'Ground', price: '—', status: 'sold' },
      { type: 'Apartment B1', area: '88 m²', floor: '1st', price: '—', status: 'sold' },
      { type: 'Apartment B2', area: '95 m²', floor: '1st', price: '—', status: 'sold' },
      { type: 'Apartment C1', area: '110 m²', floor: '2nd', price: '—', status: 'sold' },
      { type: 'Penthouse', area: '180 m²', floor: 'Rooftop', price: '—', status: 'sold' },
    ],
  },

  almond: {
    slug: 'almond',
    title: 'ALMOND',
    location: 'Nicosia',
    address: 'Nicosia, Cyprus',
    category: 'Residential',
    status: 'in-progress',
    ctaType: 'register-interest',
    year: 2025,
    heroImageId: 'clients/tdkdb/almond/renders/almond_front_angle_day',
    overviewItems: [
      { label: 'TYPE', value: 'Residential Development' },
      { label: 'LOCATION', value: 'Nicosia' },
      { label: 'DELIVERY', value: '2025' },
      { label: 'UNITS', value: 'TBC' },
      { label: 'STATUS', value: 'In Progress' },
    ],
    description: {
      title: 'A NEW ADDRESS IN NICOSIA.',
      body: [
        'Almond is TDK\'s second residential development — a considered response to the growing demand for well-designed, owner-occupied apartments in Nicosia.',
        'The design takes cues from the Armonia experience: generous floor plates, quality material specification, and outdoor spaces that genuinely extend the interior.',
        'Details to be announced. Register your interest to receive updates as the project progresses.',
      ],
    },
    specs: [],
    rendersGallery: {
      heading: 'THE VISION',
      images: ['clients/tdkdb/almond/renders/almond_front_angle_day'],
    },
    photosGallery: {
      heading: 'IN PROGRESS',
      images: [],
    },
    progressPercent: 35,
    progressLabel: 'Structure complete',
    units: [],
  },
};

const relatedProjectsMap: Record<string, { slug: string; title: string; location: string; imageId: string }[]> = {
  armonia: [
    {
      slug: 'almond',
      title: 'ALMOND',
      location: 'Nicosia',
      imageId: 'clients/tdkdb/almond/renders/almond_front_angle_day',
    },
  ],
  almond: [
    {
      slug: 'armonia',
      title: 'ARMONIA',
      location: 'Lakatameia, Nicosia',
      imageId: 'clients/tdkdb/armonia/exterior/armonia_front_angle_day',
    },
  ],
};

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = projects[slug];
  if (!project) return {};
  return {
    title: `${project.title} | TDK Design & Build`,
    description: project.description.body[0],
  };
}

export async function generateStaticParams() {
  return Object.keys(projects).map((slug) => ({ slug }));
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = projects[slug];
  if (!project) notFound();

  const showProgress =
    project.ctaType !== 'showcase' && project.status !== 'completed' && project.progressPercent !== undefined;

  const showInterestForm = project.ctaType === 'register-interest';

  return (
    <main className="bg-void text-paper">
      <ProjectHero
        title={project.title}
        location={project.location}
        status={project.status}
        year={project.year}
        heroImageId={project.heroImageId}
      />

      <ProjectOverviewBar items={project.overviewItems} />

      <ProjectDescription title={project.description.title} body={project.description.body} />

      <ProjectRendersGallery
        heading={project.rendersGallery.heading}
        images={project.rendersGallery.images}
      />

      {showProgress && project.progressPercent !== undefined && (
        <ProjectProgress
          percent={project.progressPercent}
          label={project.progressLabel ?? ''}
        />
      )}

      <ProjectPhotosGallery
        heading={project.photosGallery.heading}
        images={project.photosGallery.images}
      />

      <ProjectSpecs specs={project.specs} />

      <ProjectUnitsTable units={project.units} />

      {showInterestForm && (
        <ProjectInterestForm projectSlug={project.slug} projectName={project.title} />
      )}

      <ProjectLocation address={project.address} />

      <ProjectRelated projects={relatedProjectsMap[project.slug] ?? []} />

      <ProjectCTA ctaType={project.ctaType} />
    </main>
  );
}
