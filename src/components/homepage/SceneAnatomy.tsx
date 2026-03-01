'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { MeshGradient } from '@paper-design/shaders-react';

import { gsap, gsapInit, ScrollTrigger } from '@/lib/animations/gsap';
import { drawFrame, preloadSequence } from '@/lib/homepage/imageSequence';
import { SEQUENCE_CONFIG } from '@/lib/homepage/sequenceConfig';

const PULSE_DELAYS = [0, 400, 800, 1200, 1600, 2000]; // ms, one per node

const NODES = [
  {
    id: 1,
    name: 'Entrance',
    left: '40%',
    top: '65%',
    heading: 'The First Impression',
    body: 'Recessed lighting. Timber-lined walls. A door that announces arrival. The entrance of Armonia was designed to make every return home feel intentional.',
  },
  {
    id: 2,
    name: 'Facade',
    left: '50%',
    top: '40%',
    heading: 'The Language of White',
    body: 'White is not a neutral choice. In the Mediterranean light of Nicosia, white is alive — it shifts from warm cream at dawn to luminous silver at noon. Every facade surface was calculated for how it holds that light.',
  },
  {
    id: 3,
    name: 'Balconies',
    left: '25%',
    top: '50%',
    heading: 'Living Extended',
    body: 'The balconies are not additions. They are extensions of the living floor — same ceiling height, same material continuity, designed so the threshold between inside and outside is a question of temperature, not architecture.',
  },
  {
    id: 4,
    name: 'Glazing',
    left: '65%',
    top: '45%',
    heading: 'Glass as Architecture',
    body: 'Floor-to-ceiling glazing on every primary room. The frames are narrow by design — the view is the furniture. Passive solar orientation ensures winter sun penetrates deep while summer overhangs prevent overheating.',
  },
  {
    id: 5,
    name: 'Rooftop',
    left: '25%',
    top: '25%',
    heading: 'The Fifth Facade',
    body: "Most buildings forget their rooftops. Armonia's is designed to be inhabited — a private sky-level terrace with views across Lakatameia toward the Pentadaktylos mountains.",
  },
  {
    id: 6,
    name: 'Landscape',
    left: '40%',
    top: '75%',
    heading: 'Grounded',
    body: 'The boundary between public pavement and private threshold is handled in natural stone — a material that weathers slowly and gracefully, unlike concrete. This is how a building belongs to its street.',
  },
] as const;

export default function SceneAnatomy() {
  const [activeNode, setActiveNode] = useState<number | null>(null);
  const [displayedNode, setDisplayedNode] = useState<number | null>(null);
  const [continueVisible, setContinueVisible] = useState(false);
  const [nodesVisible, setNodesVisible] = useState(false);
  const [isMeshVisible, setIsMeshVisible] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const leftTextRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ringRefs = useRef<(HTMLDivElement | null)[]>([]);
  const continueRef = useRef<HTMLDivElement>(null);
  const transitionTL = useRef<gsap.core.Timeline | null>(null);
  const hoveredNodes = useRef(new Set<number>());
  const wrapperRef = useRef<HTMLDivElement>(null);
  const stRef = useRef<ScrollTrigger | null>(null);

  // 360 rotation canvas refs
  const rotationCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const rotationFrames = useRef<HTMLImageElement[]>([]);
  const rafIdRef = useRef<number>(0);
  const currentFrameRef = useRef<number>(0);
  const isHoveredRef = useRef<boolean>(false);
  const zoomTweenRef = useRef<gsap.core.Animation | null>(null);
  // Ref mirror of activeNode — avoids stale closure in handlePanelLeave
  const activeNodeRef = useRef<number | null>(null);

  // Keep activeNodeRef in sync with activeNode state
  useEffect(() => {
    activeNodeRef.current = activeNode;
  }, [activeNode]);

  // RAF rotation loop — stable (all refs, no state deps)
  const startRotation = useCallback(() => {
    const canvas = rotationCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || rotationFrames.current.length === 0) return;

    const interval = 1000 / SEQUENCE_CONFIG.armonia360.fps;
    let lastTime = 0;

    function tick(timestamp: number) {
      if (isHoveredRef.current) return; // stop without re-scheduling
      if (timestamp - lastTime >= interval) {
        currentFrameRef.current = (currentFrameRef.current + 1) % rotationFrames.current.length;
        drawFrame(ctx!, rotationFrames.current, currentFrameRef.current);
        lastTime = timestamp;
      }
      rafIdRef.current = requestAnimationFrame(tick);
    }
    rafIdRef.current = requestAnimationFrame(tick);
  }, []);

  // 1. ScrollTrigger (entry timer) + canvas setup
  // NOTE: Pinning is done via CSS sticky on the section, NOT via GSAP pin:true.
  // GSAP's pin inserts a spacer sibling into the DOM that React doesn't track,
  // causing a removeChild mismatch when React reconciles the page.tsx fragment.
  useLayoutEffect(() => {
    gsapInit(); // ensure plugin is registered before any ScrollTrigger call

    // Size canvas to match the right panel at device pixel ratio
    function sizeCanvas() {
      const canvas = rotationCanvasRef.current;
      const panel = rightPanelRef.current;
      if (!canvas || !panel) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = panel.clientWidth * dpr;
      canvas.height = panel.clientHeight * dpr;
      // Redraw current frame immediately after resize
      const ctx = canvas.getContext('2d');
      if (ctx) drawFrame(ctx, rotationFrames.current, currentFrameRef.current);
    }

    sizeCanvas();
    window.addEventListener('resize', sizeCanvas);

    // Defer preload until section approaches viewport (~1 screen early)
    const sequenceObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          sequenceObserver.disconnect();
          preloadSequence(SEQUENCE_CONFIG.armonia360, () => {}).then((frames) => {
            rotationFrames.current = frames;
            startRotation();
          });
        }
      },
      { rootMargin: '100% 0px' },
    );

    const meshObserver = new IntersectionObserver(
      ([entry]) => {
        setIsMeshVisible(entry.isIntersecting);
      },
      { rootMargin: '50% 0px' }, // keep alive a bit out of view, kill when far away
    );

    if (wrapperRef.current) {
      sequenceObserver.observe(wrapperRef.current);
      meshObserver.observe(wrapperRef.current);
    }

    // Track when the anatomy section is on screen to start the CONTINUE timer.
    stRef.current = ScrollTrigger.create({
      trigger: wrapperRef.current,
      start: 'top top',
      end: 'bottom bottom',
      onEnter: () => {
        timerRef.current = setTimeout(() => setContinueVisible(true), 8000);
      },
      onLeaveBack: () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      },
    });

    return () => {
      stRef.current?.kill();
      cancelAnimationFrame(rafIdRef.current);
      zoomTweenRef.current?.kill();
      window.removeEventListener('resize', sizeCanvas);
      if (timerRef.current) clearTimeout(timerRef.current);
      sequenceObserver.disconnect();
      meshObserver.disconnect();
      rotationFrames.current = []; // release 65 HTMLImageElement refs for GC
    };
  }, [startRotation]);

  // 2. Left panel text transition (animate out → swap displayedNode → animate in)
  useEffect(() => {
    const el = leftTextRef.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setDisplayedNode(activeNode);
      return;
    }

    transitionTL.current?.kill();
    const tl = gsap.timeline();
    transitionTL.current = tl;

    tl.to(el, { y: -30, opacity: 0, duration: 0.3, ease: 'power2.in' })
      .call(() => setDisplayedNode(activeNode))
      .fromTo(el, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' });

    return () => {
      tl.kill();
    };
  }, [activeNode]);

  // Right panel hover handlers
  const handlePanelEnter = useCallback(() => {
    isHoveredRef.current = true;
    cancelAnimationFrame(rafIdRef.current);
    // Only snap to frame 0 when no node is locked — preserve zoomed view on re-enter
    if (activeNodeRef.current === null) {
      currentFrameRef.current = 0;
      const ctx = rotationCanvasRef.current?.getContext('2d');
      if (ctx) drawFrame(ctx, rotationFrames.current, 0);
    }
    setNodesVisible(true);
  }, []);

  const handlePanelLeave = useCallback(() => {
    // Stay frozen while a node is locked (active)
    if (activeNodeRef.current !== null) return;
    isHoveredRef.current = false;
    setNodesVisible(false);
    zoomTweenRef.current?.kill();
    gsap.to(canvasWrapperRef.current, { scale: 1, duration: 0.4, ease: 'power2.out' });
    startRotation();
  }, [startRotation]);

  // Node interaction handlers
  const handleNodeEnter = useCallback((id: number) => {
    setActiveNode(id);
    hoveredNodes.current.add(id);
    if (hoveredNodes.current.size >= 3) setContinueVisible(true);
    // Zoom into this node's area on hover
    const node = NODES.find((n) => n.id === id);
    if (node) {
      zoomTweenRef.current?.kill();
      zoomTweenRef.current = gsap.to(canvasWrapperRef.current, {
        scale: 2,
        duration: 0.5,
        ease: 'power2.out',
        transformOrigin: `${node.left} ${node.top}`,
      });
    }
  }, []);

  const handleNodeLeave = useCallback(() => {
    setActiveNode(null);
    // Reset zoom on unhover
    zoomTweenRef.current?.kill();
    zoomTweenRef.current = gsap.to(canvasWrapperRef.current, {
      scale: 1,
      duration: 0.4,
      ease: 'power2.out',
    });
  }, []);

  // Touch / click toggle — for touch devices where hover isn't available
  const handleNodeClick = useCallback((id: number) => {
    setActiveNode((prev) => {
      if (prev === id) return null;
      hoveredNodes.current.add(id);
      if (hoveredNodes.current.size >= 3) setContinueVisible(true);
      return id;
    });
  }, []);

  // Continue prompt entrance animation
  useEffect(() => {
    if (!continueVisible || !continueRef.current) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      continueRef.current.style.opacity = '1';
      return;
    }

    gsap.fromTo(
      continueRef.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
    );
  }, [continueVisible]);

  return (
    // 200vh wrapper: 100vh visible height + 100vh scroll travel for the sticky pin.
    // CSS sticky avoids GSAP inserting a spacer sibling that React can't reconcile.
    <div ref={wrapperRef} style={{ height: '200vh' }}>
      <section ref={sectionRef} className="sticky top-0 h-screen overflow-hidden bg-void">
        {/* Animated mesh gradient background */}
        {isMeshVisible && (
          <MeshGradient
            className="pointer-events-none absolute inset-0 z-0 h-full w-full"
            colors={['#0d0d0d', '#111a1b', '#0d0d0d', '#142022']}
            speed={0.3}
          />
        )}

        {/* Node pulse keyframes.
          - translate(-50%,-50%) is baked in so the transform composes with left/top positioning.
          - Starts at opacity 1 (was 0.8) so rings are clearly visible at the peak of each pulse.
          - animation-fill-mode:backwards (set on each ring via inline style) applies the 0%
            keyframe during the stagger delay, keeping rings centered before animation fires. */}
        <style>{`
        @keyframes nodePulse {
          0%   { transform: translate(-50%, -50%) scale(1);   opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .node-pulse-ring { animation: none !important; }
        }
      `}</style>

        {/* Two-column grid */}
        <div className="relative z-10 grid h-full grid-cols-2">
          {/* ── LEFT PANEL ── */}
          <div className="relative flex items-center justify-center overflow-hidden border-r border-border px-12 lg:px-20">
            <div
              ref={leftTextRef}
              role="region"
              aria-live="polite"
              aria-label="Building detail"
              className="w-full max-w-md will-change-transform"
            >
              {displayedNode === null ? (
                <div className="flex flex-col gap-6">
                  <div className="h-0.5 w-10 bg-threshold" />
                  <p className="text-body-lg text-paper">
                    A building designed to be inhabited fully.
                  </p>
                  <p className="text-body-lg text-stone">
                    Every surface considered.
                    <br />
                    Every detail resolved.
                  </p>
                </div>
              ) : (
                (() => {
                  const node = NODES.find((n) => n.id === displayedNode);
                  if (!node) return null;
                  return (
                    <div>
                      <div className="mb-4 h-0.5 w-10 bg-threshold" />
                      <h3 className="mb-4 text-heading text-paper">{node.heading}</h3>
                      <p className="text-body-lg text-stone">{node.body}</p>
                    </div>
                  );
                })()
              )}
            </div>
          </div>

          {/* ── RIGHT PANEL — 360° rotation canvas ── */}
          <div
            ref={rightPanelRef}
            className="relative overflow-hidden"
            onMouseEnter={handlePanelEnter}
            onMouseLeave={handlePanelLeave}
          >
            {/* Canvas wrapper is the GSAP zoom target */}
            <div ref={canvasWrapperRef} className="h-full w-full">
              <canvas
                ref={rotationCanvasRef}
                className="h-full w-full"
                style={{ display: 'block' }}
              />
            </div>

            {/* 6 interactive hotspot nodes — hidden during rotation, shown on hover */}
            {NODES.map((node, i) => (
              <button
                key={node.id}
                aria-label={`Explore ${node.name}`}
                tabIndex={nodesVisible ? 0 : -1}
                className="absolute h-12 w-12 -translate-x-1/2 -translate-y-1/2 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-threshold"
                style={{
                  left: node.left,
                  top: node.top,
                  opacity: !nodesVisible
                    ? 0
                    : activeNode !== null && activeNode !== node.id
                      ? 0.25
                      : 1,
                  pointerEvents: nodesVisible ? 'auto' : 'none',
                  transition: 'opacity 300ms',
                }}
                onMouseEnter={() => handleNodeEnter(node.id)}
                onMouseLeave={handleNodeLeave}
                onClick={() => handleNodeClick(node.id)}
              >
                {/* Dark backdrop — punches contrast against busy image areas */}
                <div
                  className="absolute rounded-full"
                  style={{
                    width: 28,
                    height: 28,
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'rgba(0,0,0,0.45)',
                  }}
                />
                {/* Outer ring — pulses when inactive, glows solid teal when active */}
                <div
                  ref={(el) => {
                    ringRefs.current[i] = el;
                  }}
                  className="node-pulse-ring absolute rounded-full border transition-shadow duration-300"
                  style={{
                    width: 24,
                    height: 24,
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    borderColor: 'var(--color-threshold)',
                    boxShadow:
                      activeNode === node.id
                        ? '0 0 0 1px #66979f, 0 0 10px 2px #66979f99'
                        : '0 0 6px 1px #66979f66',
                    animation:
                      activeNode === node.id
                        ? 'none'
                        : `nodePulse 2s ease-out infinite ${PULSE_DELAYS[i]}ms`,
                    animationFillMode: activeNode === node.id ? 'none' : 'backwards',
                  }}
                />
                {/* Inner dot */}
                <div
                  className="absolute rounded-full"
                  style={{
                    width: 8,
                    height: 8,
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'var(--color-threshold)',
                    boxShadow: '0 0 8px 2px #66979fcc',
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* ↓ CONTINUE prompt — appears after 8s or after hovering 3+ nodes */}
        {continueVisible && (
          <div
            ref={continueRef}
            className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-label text-stone opacity-0"
          >
            ↓ CONTINUE
          </div>
        )}
      </section>
    </div>
  );
}
