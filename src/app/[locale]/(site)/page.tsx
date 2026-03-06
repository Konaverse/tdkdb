import dynamic from 'next/dynamic';
import ScenePhilosophy from '@/components/homepage/ScenePhilosophy';
import SceneProjects from '@/components/homepage/SceneProjects';
import SceneContact from '@/components/homepage/SceneContact';

import { getProjectsForHomepageReel } from '@/lib/sanity/queries';

// Hero is client-only (canvas + GSAP) — SSR excluded
const HeroSection = dynamic(() => import('@/components/homepage/HeroSection'), { ssr: false });

export default async function HomePage() {
  const projects = await getProjectsForHomepageReel();

  return (
    <main className="relative" style={{ backgroundColor: 'var(--color-void)' }}>
      {/* Hero — V2: 400vh pinned, 4-state cinematic sequence */}
      <HeroSection />

      {/* Scenes 4–9 */}
<ScenePhilosophy />
      <SceneProjects projects={projects} />
      <SceneContact />
    </main>
  );
}
