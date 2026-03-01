import dynamic from 'next/dynamic';
import SceneAnatomy from '@/components/homepage/SceneAnatomy';
import ScenePhilosophy from '@/components/homepage/ScenePhilosophy';
import SceneProjects from '@/components/homepage/SceneProjects';
import SceneContact from '@/components/homepage/SceneContact';
import Footer from '@/components/layout/Footer';

const HomepageCanvas = dynamic(() => import('@/components/homepage/HomepageCanvas'), {
  ssr: false,
});

export default function HomePage() {
  return (
    <>
      <HomepageCanvas />
      <SceneAnatomy />
      <ScenePhilosophy />
      <SceneProjects />
      <SceneContact />
      <div style={{ height: '1px', background: 'var(--color-border)' }} />
      <Footer />
    </>
  );
}
