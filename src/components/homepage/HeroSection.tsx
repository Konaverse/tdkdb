'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback } from 'react';
import LoadingScreen from './LoadingScreen';

const ParticleHeroBg = dynamic(() => import('./ParticleHeroBg'), { ssr: false });
const SceneHero = dynamic(() => import('./SceneHero'), { ssr: false });

export default function HeroSection() {
  const [phase, setPhase] = useState<'loading' | 'hero'>('loading');

  const handleLoadingComplete = useCallback(() => {
    setPhase('hero');
  }, []);

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Particle background — always rendering, z-0 */}
      <ParticleHeroBg />

      {/* Loading screen — z-100, fades out */}
      {phase === 'loading' && <LoadingScreen progress={1} onComplete={handleLoadingComplete} />}

      {/* Hero text — z-10, appears after loading */}
      <SceneHero isVisible={phase === 'hero'} />
    </section>
  );
}
