import dynamic from 'next/dynamic';
import SceneHero      from '@/components/homepage/SceneHero';
import SceneAnatomy    from '@/components/homepage/SceneAnatomy';
import ScenePhilosophy from '@/components/homepage/ScenePhilosophy';
import SceneProjects   from '@/components/homepage/SceneProjects';
import SceneProcess    from '@/components/homepage/SceneProcess';
import SceneContact    from '@/components/homepage/SceneContact';

const HomepageCanvas = dynamic(
  () => import('@/components/homepage/HomepageCanvas'),
  { ssr: false }
);

export default function HomePage() {
  return (
    <>
      <HomepageCanvas>
        <SceneHero />
      </HomepageCanvas>
      <SceneAnatomy />
      <ScenePhilosophy />
      <SceneProjects />
      <SceneProcess />
      <SceneContact />
    </>
  );
}
