'use client';

import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';

interface IsoLevelWarpProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Primary line color as RGB components string, e.g. "102, 151, 159"
   * Default: TDK threshold teal
   */
  color?: string;
  /**
   * Animation speed multiplier. Default: 1
   */
  speed?: number;
  /**
   * Grid density — lower = larger cells. Default: 40
   */
  density?: number;
}

const IsoLevelWarp = ({
  className,
  color = '102, 151, 159', // TDK --color-threshold teal
  speed = 1,
  density = 40,
  ...props
}: IsoLevelWarpProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = container.offsetWidth;
    let height = container.offsetHeight;
    let animationFrameId: number;

    const gridGap = density;
    // rows/cols are recomputed in resize() so they always cover the canvas
    let rows = Math.ceil(height / gridGap) + 5;
    let cols = Math.ceil(width / gridGap) + 5;

    const mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000 };
    let time = 0;

    const resize = () => {
      width = container.offsetWidth;
      height = container.offsetHeight;
      canvas.width = width;
      canvas.height = height;
      // Recompute so the grid always fills the resized canvas
      rows = Math.ceil(height / gridGap) + 5;
      cols = Math.ceil(width / gridGap) + 5;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.targetX = -1000;
      mouse.targetY = -1000;
    };

    // Touch support — maps touch position to the same mouse tracking
    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = touch.clientX - rect.left;
      mouse.targetY = touch.clientY - rect.top;
    };

    const handleTouchEnd = () => {
      mouse.targetX = -1000;
      mouse.targetY = -1000;
    };

    const smoothMix = (a: number, b: number, t: number) => a + (b - a) * t;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      mouse.x = smoothMix(mouse.x, mouse.targetX, 0.1);
      mouse.y = smoothMix(mouse.y, mouse.targetY, 0.1);

      time += 0.01 * speed;

      ctx.beginPath();

      for (let y = 0; y <= rows; y++) {
        let isFirst = true;

        for (let x = 0; x <= cols; x++) {
          const baseX = x * gridGap - gridGap * 2;
          const baseY = y * gridGap - gridGap * 2;

          const wave = Math.sin(x * 0.2 + time) * Math.cos(y * 0.2 + time) * 15;

          const dx = baseX - mouse.x;
          const dy = baseY - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 300;
          const force = Math.max(0, (maxDist - dist) / maxDist);
          const interactionY = -(force * force) * 80;

          const finalX = baseX;
          const finalY = baseY + wave + interactionY;

          if (isFirst) {
            ctx.moveTo(finalX, finalY);
            isFirst = false;
          } else {
            ctx.lineTo(finalX, finalY);
          }
        }
      }

      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, `rgba(${color}, 0)`);
      gradient.addColorStop(0.5, `rgba(${color}, 0.5)`);
      gradient.addColorStop(1, `rgba(${color}, 0)`);

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1;
      ctx.stroke();

      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchEnd);

    resize();
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
      cancelAnimationFrame(animationFrameId);
    };
  }, [color, speed, density]);

  return (
    <div
      ref={containerRef}
      className={cn('absolute inset-0 z-0 overflow-hidden', className)}
      style={{ backgroundColor: 'var(--color-void)' }}
      {...props}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />

      {/* Vignette for depth — uses void color to match brand */}
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, #0D0D0D 100%)',
        }}
      />
    </div>
  );
};

export default IsoLevelWarp;
