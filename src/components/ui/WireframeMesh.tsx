'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';

function RotatingMesh() {
  const ref = useRef<Mesh>(null);

  useFrame(() => {
    if (!ref.current) return;
    ref.current.rotation.y += 0.002;
    ref.current.rotation.x += 0.001;
  });

  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[1.8, 1]} />
      <meshBasicMaterial color="#F5F0E8" wireframe transparent opacity={0.4} />
    </mesh>
  );
}

export default function WireframeMesh() {
  return (
    <Canvas
      camera={{ position: [0, 0, 4] }}
      gl={{ alpha: true, antialias: true }}
      style={{ background: 'transparent' }}
    >
      <RotatingMesh />
    </Canvas>
  );
}
