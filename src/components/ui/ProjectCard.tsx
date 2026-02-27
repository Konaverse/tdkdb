'use client';

import Link from 'next/link';
import { projectCard } from '@/lib/cloudinary/transforms';
import { cn } from '@/lib/utils/cn';

export type ProjectStatus = 'completed' | 'in-progress' | 'upcoming';
export type ProjectCTAType = 'showcase' | 'register-interest' | 'contact';

export interface ProjectCardData {
  slug: string;
  title: string;
  location: string;
  category: string;
  status: ProjectStatus;
  ctaType: ProjectCTAType;
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

const ctaLabel: Record<ProjectCTAType, string> = {
  showcase: 'VIEW →',
  'register-interest': 'REGISTER INTEREST →',
  contact: 'ENQUIRE →',
};

interface ProjectCardProps {
  project: ProjectCardData;
  className?: string;
}

export default function ProjectCard({ project, className }: ProjectCardProps) {
  return (
    <Link
      href={`/en/projects/${project.slug}`}
      className={cn('group relative block overflow-hidden', className)}
    >
      {/* Image */}
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={projectCard(project.heroImageId)}
          alt={project.title}
          className="h-full w-full object-cover transition-transform duration-slow ease-smooth group-hover:scale-[1.05]"
        />
        {/* Dark overlay that slides up on hover */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full bg-void/90 p-6 transition-transform duration-medium ease-smooth group-hover:translate-y-0">
          <p className="text-label text-paper">{project.title}</p>
          <p className="text-body mt-1 text-stone">{project.location}</p>
          <p className="text-body text-stone">{project.year}</p>
          <p className="text-label mt-4 text-threshold">{ctaLabel[project.ctaType]}</p>
        </div>
      </div>

      {/* Status badge */}
      <div className="absolute top-4 right-4">
        <span
          className={cn(
            'text-label border px-3 py-1',
            'bg-void/80 backdrop-blur-sm',
            statusColor[project.status],
          )}
        >
          {statusLabel[project.status]}
        </span>
      </div>

      {/* Below-image info (visible without hover) */}
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-label text-paper">{project.title}</p>
          <p className="text-body text-stone">{project.location}</p>
        </div>
        <p className="text-label text-stone">{project.year}</p>
      </div>
    </Link>
  );
}
