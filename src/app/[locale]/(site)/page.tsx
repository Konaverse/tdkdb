import SceneAnatomy from '@/components/homepage/SceneAnatomy';
import ScenePhilosophy from '@/components/homepage/ScenePhilosophy';
import SceneProjects from '@/components/homepage/SceneProjects';
import SceneContact from '@/components/homepage/SceneContact';

import { getProjectsForHomepageReel } from '@/lib/sanity/queries';

import HeroSection from '@/components/homepage/HeroSection';

export default async function HomePage() {
  const projects = await getProjectsForHomepageReel();

  return (
    <>
      <HeroSection />
      <SceneAnatomy />
      <ScenePhilosophy />
      <SceneProjects projects={projects} />
      <SceneContact />
    </>
  );
}
