'use client';

import type React from 'react';
import { Suspense, useEffect, useMemo, useCallback, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// ─── Types ────────────────────────────────────────────────────────────────────

type ImageItem = string | { src: string; alt?: string };

interface FadeSettings {
  fadeIn: { start: number; end: number };
  fadeOut: { start: number; end: number };
}

interface BlurSettings {
  blurIn: { start: number; end: number };
  blurOut: { start: number; end: number };
  maxBlur: number;
}

export interface InfiniteGalleryProps {
  images: ImageItem[];
  speed?: number;
  zSpacing?: number;
  visibleCount?: number;
  falloff?: { near: number; far: number };
  fadeSettings?: FadeSettings;
  blurSettings?: BlurSettings;
  className?: string;
  style?: React.CSSProperties;
  isPaused?: boolean;
}

interface PlaneData {
  index: number;
  z: number;
  imageIndex: number;
  x: number;
  y: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_DEPTH_RANGE = 50;
const MAX_HORIZONTAL_OFFSET = 8;
const MAX_VERTICAL_OFFSET = 8;

const DEFAULT_FADE: FadeSettings = {
  fadeIn: { start: 0.05, end: 0.15 },
  fadeOut: { start: 0.85, end: 0.95 },
};

const DEFAULT_BLUR: BlurSettings = {
  blurIn: { start: 0.0, end: 0.1 },
  blurOut: { start: 0.9, end: 1.0 },
  maxBlur: 3.0,
};

// ─── Cloth shader material ─────────────────────────────────────────────────

const createClothMaterial = (): THREE.ShaderMaterial =>
  new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      map: { value: null },
      opacity: { value: 1.0 },
      blurAmount: { value: 0.0 },
      scrollForce: { value: 0.0 },
      time: { value: 0.0 },
      isHovered: { value: 0.0 },
    },
    vertexShader: `
      uniform float scrollForce;
      uniform float time;
      uniform float isHovered;
      varying vec2 vUv;
      varying vec3 vNormal;

      void main() {
        vUv = uv;
        vNormal = normal;
        vec3 pos = position;

        float curveIntensity = scrollForce * 0.3;
        float distanceFromCenter = length(pos.xy);
        float curve = distanceFromCenter * distanceFromCenter * curveIntensity;

        float ripple1 = sin(pos.x * 2.0 + scrollForce * 3.0) * 0.02;
        float ripple2 = sin(pos.y * 2.5 + scrollForce * 2.0) * 0.015;
        float clothEffect = (ripple1 + ripple2) * abs(curveIntensity) * 2.0;

        float flagWave = 0.0;
        if (isHovered > 0.5) {
          float wavePhase = pos.x * 3.0 + time * 8.0;
          float dampening = smoothstep(-0.5, 0.5, pos.x);
          flagWave = sin(wavePhase) * 0.1 * dampening;
          flagWave += sin(pos.x * 5.0 + time * 12.0) * 0.03 * dampening;
        }

        pos.z -= (curve + clothEffect + flagWave);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D map;
      uniform float opacity;
      uniform float blurAmount;
      uniform float scrollForce;
      varying vec2 vUv;

      void main() {
        vec4 color = texture2D(map, vUv);

        if (blurAmount > 0.0) {
          vec2 texelSize = 1.0 / vec2(textureSize(map, 0));
          vec4 blurred = vec4(0.0);
          float total = 0.0;
          for (float x = -2.0; x <= 2.0; x += 1.0) {
            for (float y = -2.0; y <= 2.0; y += 1.0) {
              vec2 offset = vec2(x, y) * texelSize * blurAmount;
              float weight = 1.0 / (1.0 + length(vec2(x, y)));
              blurred += texture2D(map, vUv + offset) * weight;
              total += weight;
            }
          }
          color = blurred / total;
        }

        float curveHighlight = abs(scrollForce) * 0.05;
        color.rgb += vec3(curveHighlight * 0.1);
        gl_FragColor = vec4(color.rgb, color.a * opacity);
      }
    `,
  });

// ─── Gallery scene (inside Canvas) ────────────────────────────────────────────

function GalleryScene({
  images,
  speed = 1,
  visibleCount = 8,
  fadeSettings = DEFAULT_FADE,
  blurSettings = DEFAULT_BLUR,
}: Omit<InfiniteGalleryProps, 'className' | 'style'>) {
  // Access THIS canvas via useThree
  const { gl } = useThree();

  const normalizedImages = useMemo(
    () => images.map((img) => (typeof img === 'string' ? { src: img, alt: '' } : img)),
    [images],
  );

  // useTexture suspends until all textures are loaded
  const rawTextures = useTexture(normalizedImages.map((img) => img.src));
  const textures: THREE.Texture[] = Array.isArray(rawTextures) ? rawTextures : [rawTextures];

  const materials = useMemo(
    () => Array.from({ length: visibleCount }, () => createClothMaterial()),
    [visibleCount],
  );

  const spatialPositions = useMemo(() => {
    const positions: { x: number; y: number }[] = [];
    for (let i = 0; i < visibleCount; i++) {
      const hAngle = (i * 2.618) % (Math.PI * 2);
      const vAngle = (i * 1.618 + Math.PI / 3) % (Math.PI * 2);
      const hRadius = (i % 3) * 1.2;
      const vRadius = ((i + 1) % 4) * 0.8;
      positions.push({
        x: (Math.sin(hAngle) * hRadius * MAX_HORIZONTAL_OFFSET) / 3,
        y: (Math.cos(vAngle) * vRadius * MAX_VERTICAL_OFFSET) / 4,
      });
    }
    return positions;
  }, [visibleCount]);

  const totalImages = normalizedImages.length;
  const depthRange = DEFAULT_DEPTH_RANGE;

  const planesData = useRef<PlaneData[]>(
    Array.from({ length: visibleCount }, (_, i) => ({
      index: i,
      z: visibleCount > 0 ? ((depthRange / visibleCount) * i) % depthRange : 0,
      imageIndex: totalImages > 0 ? i % totalImages : 0,
      x: spatialPositions[i]?.x ?? 0,
      y: spatialPositions[i]?.y ?? 0,
    })),
  );

  // Direct refs — never trigger React re-renders
  const meshRefs = useRef<(THREE.Mesh | null)[]>(Array(visibleCount).fill(null));
  const hoveredRef = useRef<boolean[]>(Array(visibleCount).fill(false));
  const scrollVelocityRef = useRef(0);
  const autoPlayRef = useRef(true);
  const lastInteractionRef = useRef(Date.now());

  // ─── Input handlers ──────────────────────────────────────────────────────

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      // passive: true — page scroll is NOT blocked, gallery just reads the delta
      scrollVelocityRef.current += e.deltaY * 0.01 * speed;
      autoPlayRef.current = false;
      lastInteractionRef.current = Date.now();
    },
    [speed],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        scrollVelocityRef.current -= 2 * speed;
        autoPlayRef.current = false;
        lastInteractionRef.current = Date.now();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        scrollVelocityRef.current += 2 * speed;
        autoPlayRef.current = false;
        lastInteractionRef.current = Date.now();
      }
    },
    [speed],
  );

  useEffect(() => {
    const canvas = gl.domElement; // this Three.js canvas, not HomepageCanvas
    canvas.addEventListener('wheel', handleWheel, { passive: true });
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleWheel, handleKeyDown, gl.domElement]);

  // ─── Per-frame update — direct Three.js mutations, zero React re-renders ──

  useFrame((state, delta) => {
    // Resume auto-play after 3 s inactivity
    if (!autoPlayRef.current && Date.now() - lastInteractionRef.current > 3000) {
      autoPlayRef.current = true;
    }
    if (autoPlayRef.current) scrollVelocityRef.current += 0.3 * delta;
    scrollVelocityRef.current *= 0.95;

    const time = state.clock.getElapsedTime();
    const imageAdvance = totalImages > 0 ? visibleCount % totalImages || totalImages : 0;
    const halfRange = depthRange / 2;

    planesData.current.forEach((plane, i) => {
      // Advance z and handle infinite wrap
      let newZ = plane.z + scrollVelocityRef.current * delta * 10;
      let wrapsForward = 0;
      let wrapsBackward = 0;

      if (newZ >= depthRange) {
        wrapsForward = Math.floor(newZ / depthRange);
        newZ -= depthRange * wrapsForward;
      } else if (newZ < 0) {
        wrapsBackward = Math.ceil(-newZ / depthRange);
        newZ += depthRange * wrapsBackward;
      }

      if (wrapsForward > 0 && imageAdvance > 0 && totalImages > 0) {
        plane.imageIndex = (plane.imageIndex + wrapsForward * imageAdvance) % totalImages;
      }
      if (wrapsBackward > 0 && imageAdvance > 0 && totalImages > 0) {
        const step = plane.imageIndex - wrapsBackward * imageAdvance;
        plane.imageIndex = ((step % totalImages) + totalImages) % totalImages;
      }

      plane.z = ((newZ % depthRange) + depthRange) % depthRange;
      plane.x = spatialPositions[i]?.x ?? 0;
      plane.y = spatialPositions[i]?.y ?? 0;

      const worldZ = plane.z - halfRange;

      // Mutate mesh position directly — no React re-render needed
      const mesh = meshRefs.current[i];
      if (mesh) {
        mesh.position.set(plane.x, plane.y, worldZ);
        const tex = textures[plane.imageIndex];
        if (tex?.image) {
          const img = tex.image as { width: number; height: number };
          const aspect = img.width / img.height;
          mesh.scale.set(aspect > 1 ? 2 * aspect : 2, aspect > 1 ? 2 : 2 / aspect, 1);
        }
      }

      // Opacity based on normalised depth position (0–1)
      const np = plane.z / depthRange;
      let opacity = 1;
      if (np < fadeSettings.fadeIn.start) {
        opacity = 0;
      } else if (np <= fadeSettings.fadeIn.end) {
        opacity =
          (np - fadeSettings.fadeIn.start) / (fadeSettings.fadeIn.end - fadeSettings.fadeIn.start);
      } else if (np >= fadeSettings.fadeOut.end) {
        opacity = 0;
      } else if (np >= fadeSettings.fadeOut.start) {
        opacity =
          1 -
          (np - fadeSettings.fadeOut.start) /
            (fadeSettings.fadeOut.end - fadeSettings.fadeOut.start);
      }
      opacity = Math.max(0, Math.min(1, opacity));

      // Blur based on same normalised position
      let blur = 0;
      if (np < blurSettings.blurIn.start) {
        blur = blurSettings.maxBlur;
      } else if (np <= blurSettings.blurIn.end) {
        const p =
          (np - blurSettings.blurIn.start) / (blurSettings.blurIn.end - blurSettings.blurIn.start);
        blur = blurSettings.maxBlur * (1 - p);
      } else if (np >= blurSettings.blurOut.end) {
        blur = blurSettings.maxBlur;
      } else if (np >= blurSettings.blurOut.start) {
        const p =
          (np - blurSettings.blurOut.start) /
          (blurSettings.blurOut.end - blurSettings.blurOut.start);
        blur = blurSettings.maxBlur * p;
      }
      blur = Math.max(0, Math.min(blurSettings.maxBlur, blur));

      // Update material uniforms directly
      const material = materials[i];
      if (material?.uniforms) {
        material.uniforms.map.value = textures[plane.imageIndex] ?? null;
        material.uniforms.opacity.value = opacity;
        material.uniforms.blurAmount.value = blur;
        material.uniforms.time.value = time;
        material.uniforms.scrollForce.value = scrollVelocityRef.current;
        material.uniforms.isHovered.value = hoveredRef.current[i] ? 1.0 : 0.0;
      }
    });
  });

  if (normalizedImages.length === 0) return null;

  return (
    <>
      {planesData.current.map((plane, i) => {
        const texture = textures[plane.imageIndex];
        const material = materials[i];
        if (!texture || !material) return null;

        // Set initial texture so the plane isn't blank on first render
        material.uniforms.map.value = texture;

        const aspect = texture.image
          ? (texture.image as { width: number; height: number }).width /
            (texture.image as { width: number; height: number }).height
          : 1;
        const scale: [number, number, number] =
          aspect > 1 ? [2 * aspect, 2, 1] : [2, 2 / aspect, 1];
        const worldZ = plane.z - depthRange / 2;

        return (
          <mesh
            key={i}
            ref={(el) => {
              meshRefs.current[i] = el;
            }}
            position={[plane.x, plane.y, worldZ]}
            scale={scale}
            material={material}
            onPointerEnter={() => {
              hoveredRef.current[i] = true;
            }}
            onPointerLeave={() => {
              hoveredRef.current[i] = false;
            }}
          >
            <planeGeometry args={[1, 1, 32, 32]} />
          </mesh>
        );
      })}
    </>
  );
}

// ─── Fallback (no WebGL) ───────────────────────────────────────────────────

function FallbackGallery({ images }: { images: ImageItem[] }) {
  const normalizedImages = useMemo(
    () => images.map((img) => (typeof img === 'string' ? { src: img, alt: '' } : img)),
    [images],
  );
  return (
    <div className="flex h-full items-center justify-center bg-void p-4">
      <div className="grid max-h-96 grid-cols-2 gap-4 overflow-y-auto md:grid-cols-3">
        {normalizedImages.map((img, i) => (
          <img key={i} src={img.src} alt={img.alt ?? ''} className="h-32 w-full object-cover" />
        ))}
      </div>
    </div>
  );
}

// ─── Public component ──────────────────────────────────────────────────────

export default function InfiniteGallery({
  images,
  className = 'h-96 w-full',
  style,
  speed,
  visibleCount,
  fadeSettings,
  blurSettings,
  isPaused = false,
}: InfiniteGalleryProps) {
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) setWebglSupported(false);
    } catch {
      setWebglSupported(false);
    }
  }, []);

  if (!webglSupported) {
    return (
      <div className={className} style={style}>
        <FallbackGallery images={images} />
      </div>
    );
  }

  return (
    <div className={className} style={style}>
      <Canvas
        camera={{ position: [0, 0, 0], fov: 55 }}
        gl={{ antialias: true, alpha: true }}
        frameloop={isPaused ? 'never' : 'always'}
      >
        {/* Suspense boundary so useTexture can suspend without crashing */}
        <Suspense fallback={null}>
          <GalleryScene
            images={images}
            speed={speed}
            visibleCount={visibleCount}
            fadeSettings={fadeSettings}
            blurSettings={blurSettings}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
