import AboutGrid from '@/components/homepage/AboutGrid';
import ProjectsPinned from '@/components/homepage/ProjectsPinned';
import Interlude from '@/components/homepage/Interlude';
import ContactSection from '@/components/homepage/ContactSection';
import HomeLoader from '@/components/homepage/HomeLoader';
import Hero from '@/components/homepage/Hero';
import { getProjectsForHomepageReel, getSiteImages, getSiteSettings } from '@/lib/sanity/queries';

const HERO_PARAGRAPHS: [string, string] = [
  'TDK is a design-and-build studio in Nicosia. The architects who draw a residence are the same people who build it and hand over the keys — one team, accountable from the first sketch to the last fitting.',
  'We take on a few homes at a time, so each one is detailed as if it were the only one. Almond Suites in Strovolos is the current project: eight residences, now under construction.',
];

export default async function HomePage() {
  const [projects, settings, images] = await Promise.all([
    getProjectsForHomepageReel(),
    getSiteSettings(),
    getSiteImages(),
  ]);

  return (
    <main className="relative">
      {/* First-load intro overlay (homepage only) */}
      <HomeLoader />

      <Hero paragraphs={HERO_PARAGRAPHS} socials={settings?.socialLinks ?? []} />

      {/* Projects — one project per screen, pinned. */}
      <ProjectsPinned projects={projects} />

      {/* About — flat architectural grid, ~130vh, no pin. */}
      <AboutGrid people={images['home-about-people']} material={images['home-about-material']} />

      {/* Interlude — pinned: three beats over the kitchen, then the render
          shrinks to a frame under "We House Your Dream". */}
      <Interlude image={images['home-interlude']} />

      {/* Contact — the board's layout: CONTACT, intro, details, tall render. */}
      <ContactSection settings={settings} plate={images['home-contact-plate']} />
    </main>
  );
}
