import { heroImage } from '@/lib/cloudinary/transforms';
import GridWrapper from '@/components/layout/GridWrapper';
import TextReveal from '@/components/animations/TextReveal';
import { cn } from '@/lib/utils/cn';

type ProjectStatus = 'completed' | 'in-progress' | 'upcoming';

interface ProjectHeroProps {
  title: string;
  location: string;
  status: ProjectStatus;
  year: number;
  heroImageId: string;
}

const statusLabel: Record<ProjectStatus, string> = {
  completed: 'COMPLETED',
  'in-progress': 'IN PROGRESS',
  upcoming: 'UPCOMING',
};

const statusColor: Record<ProjectStatus, string> = {
  completed: 'text-stone border-stone',
  'in-progress': 'text-threshold border-threshold',
  upcoming: 'text-stone border-stone',
};

export default function ProjectHero({
  title,
  location,
  status,
  year,
  heroImageId,
}: ProjectHeroProps) {
  return (
    <section className="relative flex min-h-screen items-end pb-24">
      <img
        src={heroImage(heroImageId)}
        alt={title}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ opacity: 0.6 }}
      />
      <div className="via-void/40 absolute inset-0 bg-gradient-to-t from-void to-transparent" />
      <GridWrapper className="relative z-10">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <span className={cn('border px-3 py-1 text-label', statusColor[status])}>
            {statusLabel[status]}
          </span>
          <span className="text-label text-stone">{year}</span>
        </div>
        <TextReveal tag="h1" className="max-w-3xl text-display-lg text-paper">
          {title}
        </TextReveal>
        <p className="mt-4 text-body-lg text-stone">{location}</p>
      </GridWrapper>
    </section>
  );
}
