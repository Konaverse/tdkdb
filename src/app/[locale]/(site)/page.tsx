import AboutGrid from '@/components/homepage/AboutGrid';
import HomepageReel from '@/components/homepage/HomepageReel';
import TheDifference from '@/components/homepage/TheDifference';
import FeaturedResidence from '@/components/homepage/FeaturedResidence';
import SceneContact from '@/components/homepage/SceneContact';
import HomeLoader from '@/components/homepage/HomeLoader';
import Hero from '@/components/homepage/Hero';
import { getProjectsForHomepageReel, getFeaturedResidence } from '@/lib/sanity/queries';

/** Full-height hero photograph. A completed building, not a render. */
const HERO_IMAGE_ID = 'clients/tdkdb/armonia/exterior/armonia_front_angle_day';

const HERO_HEADLINE: [string, string] = ['We draw it.', 'Then we build it.'];

const HERO_PARAGRAPH =
  'A fully integrated studio — architects, construction managers and interior designers under one roof. Fewer handoffs. More coherence.';

export default async function HomePage() {
  const [projects, featured] = await Promise.all([
    getProjectsForHomepageReel(),
    getFeaturedResidence(),
  ]);

  return (
    <main className="relative">
      {/* First-load intro overlay (homepage only) */}
      <HomeLoader />

      <Hero
        imageId={HERO_IMAGE_ID}
        headline={HERO_HEADLINE}
        paragraph={HERO_PARAGRAPH}
        ticker={
          featured
            ? {
                title: featured.title,
                location: featured.location,
                progressPercent: featured.progressPercent,
              }
            : null
        }
      />

      {/* About — flat architectural grid, ~130vh, no pin. */}
      <AboutGrid />

      {/* Projects reel. */}
      <HomepageReel projects={projects} />

      {/* Remaining scenes. */}
      <div className="relative z-[60] bg-void">
        <TheDifference />
        {featured && <FeaturedResidence project={featured} />}
        <SceneContact />
      </div>
    </main>
  );
}
