import Link from 'next/link';
import Section from '@/components/layout/Section';
import GridWrapper from '@/components/layout/GridWrapper';
import FadeUp from '@/components/animations/FadeUp';
import { projectCard } from '@/lib/cloudinary/transforms';

export interface RelatedProject {
  slug: string;
  title: string;
  location: string;
  imageId: string;
}

interface ProjectRelatedProps {
  projects: RelatedProject[];
}

export default function ProjectRelated({ projects }: ProjectRelatedProps) {
  if (!projects || projects.length === 0) return null;

  return (
    <Section background="surface">
      <GridWrapper>
        <FadeUp>
          <p className="mb-12 text-label text-stone">MORE PROJECTS</p>
        </FadeUp>
        <div className="grid gap-8 sm:grid-cols-2">
          {projects.map((project, i) => (
            <FadeUp key={project.slug} delay={i * 100}>
              <Link href={`/en/projects/${project.slug}`} className="group flex flex-col gap-4">
                <div className="overflow-hidden">
                  <img
                    src={projectCard(project.imageId)}
                    alt={project.title}
                    className="aspect-[4/3] w-full object-cover transition-transform duration-slow ease-smooth group-hover:scale-[1.05]"
                  />
                </div>
                <div>
                  <p className="text-label text-paper">{project.title}</p>
                  <p className="text-body text-stone">{project.location}</p>
                </div>
              </Link>
            </FadeUp>
          ))}
        </div>
      </GridWrapper>
    </Section>
  );
}
