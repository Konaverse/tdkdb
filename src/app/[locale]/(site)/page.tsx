import dynamic from 'next/dynamic';
import SceneAnatomy from '@/components/homepage/SceneAnatomy';
import ScenePhilosophy from '@/components/homepage/ScenePhilosophy';
import SceneProjects from '@/components/homepage/SceneProjects';
import SceneContact from '@/components/homepage/SceneContact';

import { getProjectsForHomepageReel } from '@/lib/sanity/queries';

const HomepageCanvas = dynamic(() => import('@/components/homepage/HomepageCanvas'), {
  ssr: false,
});

export default async function HomePage() {
  const projects = await getProjectsForHomepageReel();

  return (
    <>
      <style>{`
        /* Hide global navbar on homepage during canvas scenes if necessary, 
           or let it be. But do not render duplicate footer. */
      `}</style>
      <HomepageCanvas />
      <SceneAnatomy />
      <ScenePhilosophy />
      <SceneProjects projects={projects} />
      <SceneContact />
    </>
  );
}
