'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

// --- Types ---

interface Particle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  angle: number;
}

interface BackgroundParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  phase: number;
}

interface MouseState {
  x: number;
  y: number;
  isActive: boolean;
}

// --- TDK Design Tokens ---
// Mapped from TDK_HOMEPAGE_EXPERIENCE.md Section 16

const TDK_COLORS = {
  void: '#0D0D0D',
  paper: '#F5F0E8',
  paperRgb: '245, 240, 232',
  threshold: '#66979f',
  thresholdRgb: '102, 151, 159',
  stone: '#8C8C8C',
  stoneRgb: '140, 140, 140',
} as const;

// --- Configuration Constants ---

const PARTICLE_DENSITY = 0.00012; // Slightly less dense for architectural minimalism
const BG_PARTICLE_DENSITY = 0.00004;
const MOUSE_RADIUS = 200; // Generous radius for premium feel
const RETURN_SPEED = 0.06; // Slower return = more cinematic
const DAMPING = 0.92; // Higher = particles glide longer
const REPULSION_STRENGTH = 1.0;

// --- Helper Functions ---

const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;

// --- Particle Hero Background ---

const ParticleHeroBg: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mutable state refs — no re-renders during animation
  const particlesRef = useRef<Particle[]>([]);
  const backgroundParticlesRef = useRef<BackgroundParticle[]>([]);
  const mouseRef = useRef<MouseState>({ x: -1000, y: -1000, isActive: false });
  const frameIdRef = useRef<number>(0);

  // Initialize Particles
  const initParticles = useCallback((width: number, height: number) => {
    // Main interactive particles
    const particleCount = Math.floor(width * height * PARTICLE_DENSITY);
    const newParticles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;

      // 90% paper-white, 10% teal accent (The Threshold Rule: sparse, signal-like)
      let color: string;
      const roll = Math.random();
      if (roll > 0.9) {
        color = TDK_COLORS.threshold;
      } else {
        color = TDK_COLORS.paper;
      }

      newParticles.push({
        x,
        y,
        originX: x,
        originY: y,
        vx: 0,
        vy: 0,
        size: randomRange(0.8, 2.2),
        color,
        angle: Math.random() * Math.PI * 2,
      });
    }
    particlesRef.current = newParticles;

    // Background ambient particles (drifting dust)
    const bgCount = Math.floor(width * height * BG_PARTICLE_DENSITY);
    const newBgParticles: BackgroundParticle[] = [];

    for (let i = 0; i < bgCount; i++) {
      newBgParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        size: randomRange(0.3, 1.2),
        alpha: randomRange(0.05, 0.25),
        phase: Math.random() * Math.PI * 2,
      });
    }
    backgroundParticlesRef.current = newBgParticles;
  }, []);

  // Animation Loop
  const animate = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas to void black
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // --- Background Effects ---

    // Pulsating radial glow — uses threshold teal, very subtle
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const pulseSpeed = 0.0006;
    const pulseOpacity = Math.sin(time * pulseSpeed) * 0.025 + 0.055;

    const gradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      Math.max(canvas.width, canvas.height) * 0.6,
    );
    gradient.addColorStop(0, `rgba(${TDK_COLORS.thresholdRgb}, ${pulseOpacity})`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Background drifting dust particles
    const bgParticles = backgroundParticlesRef.current;

    for (let i = 0; i < bgParticles.length; i++) {
      const p = bgParticles[i];
      p.x += p.vx;
      p.y += p.vy;

      // Wrap around screen
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      // Twinkle effect
      const twinkle = Math.sin(time * 0.0015 + p.phase) * 0.5 + 0.5;
      const currentAlpha = p.alpha * (0.2 + 0.8 * twinkle);

      ctx.globalAlpha = currentAlpha;
      ctx.fillStyle = TDK_COLORS.paper;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // --- Main Foreground Physics ---

    const particles = particlesRef.current;
    const mouse = mouseRef.current;

    // Phase 1: Apply Forces
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      const dx = mouse.x - p.x;
      const dy = mouse.y - p.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Mouse repulsion
      if (mouse.isActive && distance < MOUSE_RADIUS) {
        const forceDirectionX = dx / distance;
        const forceDirectionY = dy / distance;
        const force = (MOUSE_RADIUS - distance) / MOUSE_RADIUS;

        const repulsion = force * REPULSION_STRENGTH;
        p.vx -= forceDirectionX * repulsion * 4;
        p.vy -= forceDirectionY * repulsion * 4;
      }

      // Spring force (return to origin)
      const springDx = p.originX - p.x;
      const springDy = p.originY - p.y;

      p.vx += springDx * RETURN_SPEED;
      p.vy += springDy * RETURN_SPEED;
    }

    // Phase 2: Collision resolution (skip for performance on large counts)
    // Only resolve collisions for a subset to maintain 60fps
    const collisionLimit = Math.min(particles.length, 300);
    for (let i = 0; i < collisionLimit; i++) {
      for (let j = i + 1; j < collisionLimit; j++) {
        const p1 = particles[i];
        const p2 = particles[j];

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const distSq = dx * dx + dy * dy;
        const minDist = p1.size + p2.size;

        if (distSq < minDist * minDist) {
          const dist = Math.sqrt(distSq);

          if (dist > 0.01) {
            const nx = dx / dist;
            const ny = dy / dist;

            const overlap = minDist - dist;
            const pushX = nx * overlap * 0.5;
            const pushY = ny * overlap * 0.5;

            p1.x -= pushX;
            p1.y -= pushY;
            p2.x += pushX;
            p2.y += pushY;

            const dvx = p1.vx - p2.vx;
            const dvy = p1.vy - p2.vy;
            const velocityAlongNormal = dvx * nx + dvy * ny;

            if (velocityAlongNormal > 0) {
              const m1 = p1.size;
              const m2 = p2.size;
              const restitution = 0.8;

              const impulseMagnitude =
                (-(1 + restitution) * velocityAlongNormal) / (1 / m1 + 1 / m2);
              const impulseX = impulseMagnitude * nx;
              const impulseY = impulseMagnitude * ny;

              p1.vx += impulseX / m1;
              p1.vy += impulseY / m1;
              p2.vx -= impulseX / m2;
              p2.vy -= impulseY / m2;
            }
          }
        }
      }
    }

    // Phase 3: Integration & Drawing
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      p.vx *= DAMPING;
      p.vy *= DAMPING;
      p.x += p.vx;
      p.y += p.vy;

      // Draw particle
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

      const velocity = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      const opacity = Math.min(0.25 + velocity * 0.12, 1);

      if (p.color === TDK_COLORS.paper) {
        ctx.fillStyle = `rgba(${TDK_COLORS.paperRgb}, ${opacity})`;
      } else if (p.color === TDK_COLORS.threshold) {
        ctx.fillStyle = `rgba(${TDK_COLORS.thresholdRgb}, ${Math.min(opacity + 0.15, 1)})`;
      } else {
        ctx.fillStyle = p.color;
      }

      ctx.fill();
    }

    frameIdRef.current = requestAnimationFrame(animate);
  }, []);

  // Resize Handler
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        canvasRef.current.width = width * dpr;
        canvasRef.current.height = height * dpr;

        canvasRef.current.style.width = `${width}px`;
        canvasRef.current.style.height = `${height}px`;

        const ctx = canvasRef.current.getContext('2d');
        if (ctx) ctx.scale(dpr, dpr);

        initParticles(width, height);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [initParticles]);

  // Start Animation
  useEffect(() => {
    frameIdRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameIdRef.current);
  }, [animate]);

  // Mouse Handlers
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      isActive: true,
    };
  };

  const handleMouseLeave = () => {
    mouseRef.current.isActive = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!containerRef.current) return;
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
      isActive: true,
    };
  };

  const handleTouchEnd = () => {
    mouseRef.current.isActive = false;
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0 overflow-hidden"
      style={{ backgroundColor: TDK_COLORS.void }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
};

export default ParticleHeroBg;
