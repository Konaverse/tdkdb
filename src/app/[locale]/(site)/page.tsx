import HomepageReel from '@/components/homepage/HomepageReel';
import TheDifference from '@/components/homepage/TheDifference';
import FeaturedResidence from '@/components/homepage/FeaturedResidence';
import SceneContact from '@/components/homepage/SceneContact';
import HomeLoader from '@/components/homepage/HomeLoader';
import { getProjectsForHomepageReel, getFeaturedResidence } from '@/lib/sanity/queries';

import HeroMinimal from '@/components/homepage/HeroMinimal';

export default async function HomePage() {
  const [projects, featured] = await Promise.all([
    getProjectsForHomepageReel(),
    getFeaturedResidence(),
  ]);

  return (
    <main className="relative">
      {/* First-load intro overlay (homepage only) */}
      <HomeLoader />

      {/* Hero — Minimal */}
      <HeroMinimal />

      {/* About → Projects, one continuous pinned reel (fades the hero title at
          the boundary, so it owns the z-layering through the handoff). */}
      <HomepageReel projects={projects} />

      {/* Remaining scenes — cover the fixed hero (title already faded by the reel). */}
      <div className="relative z-[60] bg-void">
        <TheDifference />
        {featured && <FeaturedResidence project={featured} />}
        <SceneContact />
      </div>
    </main>
  );
}
