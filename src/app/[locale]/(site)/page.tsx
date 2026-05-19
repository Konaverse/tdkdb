import SceneProjects from '@/components/homepage/SceneProjects';
import SceneAbout from '@/components/homepage/SceneAbout';
import SceneBento from '@/components/homepage/SceneBento';
import SceneContact from '@/components/homepage/SceneContact';
import { getProjectsForHomepageReel } from '@/lib/sanity/queries';

import HeroMinimal from '@/components/homepage/HeroMinimal';

export default async function HomePage() {
  const projects = await getProjectsForHomepageReel();

  return (
    <main className="relative">
      {/* Hero — Minimal */}
      <HeroMinimal />

      <SceneAbout />

      {/* Post-about scenes wrapper to cover fixed Hero content */}
      <div className="relative z-[60] bg-void">
        <SceneProjects projects={projects} />
        <SceneBento />
        <SceneContact />
      </div>
    </main>
  );
}
