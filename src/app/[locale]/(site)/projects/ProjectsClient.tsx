'use client';

import { useState } from 'react';
import Section from '@/components/layout/Section';
import GridWrapper from '@/components/layout/GridWrapper';
import TextReveal from '@/components/animations/TextReveal';
import FadeUp from '@/components/animations/FadeUp';
import ProjectCard, { type ProjectCardData } from '@/components/ui/ProjectCard';
import FilterTabs from '@/components/ui/FilterTabs';
import { cn } from '@/lib/utils/cn';

const projects: ProjectCardData[] = [
  {
    slug: 'armonia',
    title: 'ARMONIA',
    location: 'Lakatameia, Nicosia',
    category: 'Residential',
    status: 'completed',
    ctaType: 'showcase',
    year: 2024,
    heroImageId: 'clients/tdkdb/armonia/exterior/armonia_front_angle_day',
  },
  {
    slug: 'almond',
    title: 'ALMOND',
    location: 'Nicosia',
    category: 'Residential',
    status: 'in-progress',
    ctaType: 'register-interest',
    year: 2025,
    heroImageId: 'clients/tdkdb/almond/renders/almond_front_angle_day',
  },
];

const categoryOptions = ['All', 'Residential', 'Commercial', 'Mixed-Use'];
const statusOptions = ['All', 'Completed', 'In Progress', 'Upcoming'];

const statusMap: Record<string, string> = {
  Completed: 'completed',
  'In Progress': 'in-progress',
  Upcoming: 'upcoming',
};

export default function ProjectsClient() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeStatus, setActiveStatus] = useState('All');

  const filtered = projects.filter((p) => {
    const catMatch = activeCategory === 'All' || p.category === activeCategory;
    const statusMatch = activeStatus === 'All' || p.status === statusMap[activeStatus];
    return catMatch && statusMatch;
  });

  return (
    <main className="bg-void text-paper">
      {/* ── Hero ── */}
      <section className="flex min-h-[50vh] items-end pb-24 pt-40">
        <GridWrapper>
          <p className="text-label mb-4 text-stone">OUR WORK</p>
          <TextReveal tag="h1" className="text-display-lg max-w-3xl text-paper">
            PROJECTS BUILT WITH PURPOSE.
          </TextReveal>
        </GridWrapper>
      </section>

      {/* ── Filters ── */}
      <Section>
        <GridWrapper>
          <div className="mb-12 flex flex-col gap-6 border-b border-border pb-8 sm:flex-row sm:items-center sm:gap-16">
            <div className="flex flex-col gap-2">
              <span className="text-label text-stone">CATEGORY</span>
              <FilterTabs
                options={categoryOptions}
                active={activeCategory}
                onChange={setActiveCategory}
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-label text-stone">STATUS</span>
              <FilterTabs
                options={statusOptions}
                active={activeStatus}
                onChange={setActiveStatus}
              />
            </div>
          </div>

          {/* Masonry grid */}
          <div className="columns-1 gap-8 sm:columns-2 lg:columns-3">
            {projects.map((project, i) => {
              const visible = filtered.includes(project);
              return (
                <FadeUp key={project.slug} delay={i * 100} className="mb-8 break-inside-avoid">
                  <div
                    className={cn(
                      'transition-all duration-medium ease-smooth',
                      visible ? 'opacity-100' : 'pointer-events-none h-0 overflow-hidden opacity-0',
                    )}
                  >
                    <ProjectCard project={project} />
                  </div>
                </FadeUp>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="py-24 text-center">
              <p className="text-body text-stone">No projects match the current filters.</p>
            </div>
          )}
        </GridWrapper>
      </Section>
    </main>
  );
}
