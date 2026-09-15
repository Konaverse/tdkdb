import AboutGrid from '@/components/homepage/AboutGrid';
import ProjectsPinned from '@/components/homepage/ProjectsPinned';
import Interlude from '@/components/homepage/Interlude';
import FeaturedResidence from '@/components/homepage/FeaturedResidence';
import SceneContact from '@/components/homepage/SceneContact';
import HomeLoader from '@/components/homepage/HomeLoader';
import Hero from '@/components/homepage/Hero';
import {
  getProjectsForHomepageReel,
  getFeaturedResidence,
  getSiteSettings,
} from '@/lib/sanity/queries';

const HERO_PARAGRAPHS: [string, string] = [
  'TDK is a design-and-build studio in Nicosia. The architects who draw a residence are the same people who build it and hand over the keys — one team, accountable from the first sketch to the last fitting.',
  'We take on a few homes at a time, so each one is detailed as if it were the only one. Almond Suites in Strovolos is the current project: eight residences, now under construction.',
];

export default async function HomePage() {
  const [projects, featured, settings] = await Promise.all([
    getProjectsForHomepageReel(),
    getFeaturedResidence(),
    getSiteSettings(),
  ]);

  return (
    <main className="relative">
      {/* First-load intro overlay (homepage only) */}
      <HomeLoader />

      <Hero paragraphs={HERO_PARAGRAPHS} socials={settings?.socialLinks ?? []} />

      {/* Projects — one project per screen, pinned. */}
      <ProjectsPinned projects={projects} />

      {/* About — flat architectural grid, ~130vh, no pin. */}
      <AboutGrid />

      {/* Interlude — pinned: three beats over the kitchen, then the render
          shrinks to a frame under "We House Your Dream". */}
      <Interlude />

      {/* Remaining scenes. */}
      <div className="relative z-[60] bg-void">
        {featured && <FeaturedResidence project={featured} />}
        <SceneContact />
      </div>
    </main>
  );
}
