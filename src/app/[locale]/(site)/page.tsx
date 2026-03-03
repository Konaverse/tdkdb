import dynamic from 'next/dynamic';
import SceneAnatomy from '@/components/homepage/SceneAnatomy';
import ScenePhilosophy from '@/components/homepage/ScenePhilosophy';
import SceneProjects from '@/components/homepage/SceneProjects';
import SceneContact from '@/components/homepage/SceneContact';
import Footer from '@/components/layout/Footer';

import { getProjectsForHomepageReel } from '@/lib/sanity/queries';

const HomepageCanvas = dynamic(() => import('@/components/homepage/HomepageCanvas'), {
  ssr: false,
});

export default async function HomePage() {
  const projects = await getProjectsForHomepageReel();

  return (
    <>
      <HomepageCanvas />
      <SceneAnatomy />
      <ScenePhilosophy />
      <SceneProjects projects={projects} />
      <SceneContact />
      <div style={{ height: '1px', background: 'var(--color-border)' }} />
      <Footer />
    </>
  );
}
