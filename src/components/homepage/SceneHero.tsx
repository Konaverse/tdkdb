'use client';

import React from 'react';

interface SceneHeroProps {
  isVisible: boolean;
}

export default function SceneHero({ isVisible }: SceneHeroProps) {
  if (!isVisible) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center">
      <h1 className="text-display-md tracking-[0.2em] text-paper">SCENE HERO PLACEHOLDER</h1>
    </div>
  );
}
