'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { gsap, gsapInit, ScrollTrigger } from '@/lib/animations/gsap';
import { heroImage } from '@/lib/cloudinary/transforms';

const PULSE_DELAYS = [0, 400, 800, 1200, 1600, 2000]; // ms, one per node

const NODES = [
  {
    id: 1,
    name: 'Entrance',
    left: '48%',
    top: '72%',
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
    left: '35%',
    top: '52%',
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
    left: '50%',
    top: '18%',
    heading: 'The Fifth Facade',
    body: "Most buildings forget their rooftops. Armonia's is designed to be inhabited — a private sky-level terrace with views across Lakatameia toward the Pentadaktylos mountains.",
  },
  {
    id: 6,
    name: 'Landscape',
    left: '30%',
    top: '82%',
    heading: 'Grounded',
    body: 'The boundary between public pavement and private threshold is handled in natural stone — a material that weathers slowly and gracefully, unlike concrete. This is how a building belongs to its street.',
  },
] as const;

export default function SceneAnatomy() {
  const [activeNode, setActiveNode] = useState<number | null>(null);
  const [displayedNode, setDisplayedNode] = useState<number | null>(null);
  const [continueVisible, setContinueVisible] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const leftTextRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ringRefs = useRef<(HTMLDivElement | null)[]>([]);
  const continueRef = useRef<HTMLDivElement>(null);
  const transitionTL = useRef<gsap.core.Timeline | null>(null);
  const hoveredNodes = useRef(new Set<number>());
  const wrapperRef = useRef<HTMLDivElement>(null);
  const stRef = useRef<ScrollTrigger | null>(null);

  // 1. ScrollTrigger (entry timer only) + breathing animation
  // NOTE: Pinning is done via CSS sticky on the section, NOT via GSAP pin:true.
  // GSAP's pin inserts a spacer sibling into the DOM that React doesn't track,
  // causing a removeChild mismatch when React reconciles the page.tsx fragment.
  useLayoutEffect(() => {
    gsapInit(); // ensure plugin is registered before any ScrollTrigger call

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Track when the anatomy section is on screen to start the CONTINUE timer.
    // Trigger on the wrapper (200vh) — start/end bracket the 100vh scroll window.
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

    // Breathing animation scoped to this section via gsap.context
    const ctx = gsap.context(() => {
      if (!prefersReducedMotion) {
        gsap.to(imageRef.current, {
          scale: 1.003,
          duration: 4,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });
      }
    }, sectionRef);

    return () => {
      stRef.current?.kill();
      ctx.revert();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

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

  // SVG connector line helpers
  const drawConnector = useCallback((nodeId: number) => {
    const section = sectionRef.current;
    const path = pathRef.current;
    if (!section || !path) return;

    const node = NODES.find((n) => n.id === nodeId);
    if (!node) return;

    const { width, height } = section.getBoundingClientRect();
    // Node is positioned as % of the RIGHT PANEL (50%–100% of section width)
    const nodeXPx = width * 0.5 + (parseFloat(node.left) / 100) * width * 0.5;
    const nodeYPx = (parseFloat(node.top) / 100) * height;

    // Path draws from node position toward the left edge
    const d = `M ${nodeXPx} ${nodeYPx} L 0 ${nodeYPx}`;
    path.setAttribute('d', d);

    const pathLength = nodeXPx;
    path.style.strokeDasharray = `${pathLength}`;
    path.style.strokeDashoffset = `${pathLength}`; // start hidden
    path.style.opacity = '1';

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      path.style.strokeDashoffset = '0';
    } else {
      gsap.to(path, { strokeDashoffset: 0, duration: 0.4, ease: 'power2.out' });
    }
  }, []);

  const clearConnector = useCallback(() => {
    const path = pathRef.current;
    if (!path) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      path.style.opacity = '0';
      path.setAttribute('d', '');
    } else {
      gsap.to(path, {
        opacity: 0,
        duration: 0.15,
        onComplete: () => {
          path.setAttribute('d', '');
        },
      });
    }
  }, []);

  // 4. Node interaction handlers
  const handleNodeEnter = useCallback(
    (id: number) => {
      setActiveNode(id);
      hoveredNodes.current.add(id);
      if (hoveredNodes.current.size >= 3) setContinueVisible(true);
      drawConnector(id);
    },
    [drawConnector],
  );

  const handleNodeLeave = useCallback(() => {
    setActiveNode(null);
    clearConnector();
  }, [clearConnector]);

  // Touch / click toggle — reads prev via functional updater to avoid stale closure
  const handleNodeClick = useCallback(
    (id: number) => {
      setActiveNode((prev) => {
        if (prev === id) {
          clearConnector();
          return null;
        }
        drawConnector(id);
        hoveredNodes.current.add(id);
        if (hoveredNodes.current.size >= 3) setContinueVisible(true);
        return id;
      });
    },
    [drawConnector, clearConnector],
  );

  // 5. Continue prompt entrance animation
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
        <div className="grid h-full grid-cols-2">
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
                <div className="flex flex-col items-center gap-3">
                  <div className="h-px w-12 bg-border" />
                  <span className="text-label text-stone">Explore the Building</span>
                  <div className="h-px w-12 bg-border" />
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

          {/* ── RIGHT PANEL ── */}
          <div className="relative overflow-hidden">
            <img
              ref={imageRef}
              src={heroImage('clients/tdkdb/armonia/exterior/armonia_front_angle_day')}
              alt="Armonia building — interactive architectural overview"
              className="h-full w-full object-cover will-change-transform"
              draggable={false}
            />

            {/* 6 interactive hotspot nodes */}
            {NODES.map((node, i) => (
              <button
                key={node.id}
                aria-label={`Explore ${node.name}`}
                className="absolute h-12 w-12 -translate-x-1/2 -translate-y-1/2 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-threshold"
                style={{
                  left: node.left,
                  top: node.top,
                  opacity: activeNode !== null && activeNode !== node.id ? 0.25 : 1,
                  transition: 'opacity 150ms',
                }}
                onMouseEnter={() => handleNodeEnter(node.id)}
                onMouseLeave={handleNodeLeave}
                onClick={() => handleNodeClick(node.id)}
              >
                {/* Outer ring — pulse when inactive, solid teal when active */}
                <div
                  ref={(el) => {
                    ringRefs.current[i] = el;
                  }}
                  className="node-pulse-ring absolute rounded-full border transition-colors duration-300"
                  style={{
                    width: 24,
                    height: 24,
                    left: '50%',
                    top: '50%',
                    // 0.65 opacity so the ring is clearly visible at the start of each pulse cycle
                    borderColor:
                      activeNode === node.id ? 'var(--color-threshold)' : 'rgba(245,240,232,0.65)',
                    animation:
                      activeNode === node.id
                        ? 'none'
                        : `nodePulse 2s ease-out infinite ${PULSE_DELAYS[i]}ms`,
                    // backwards: apply the 0% keyframe (centered + opacity 1) during the stagger
                    // delay so rings are visible and correctly placed before their animation fires
                    animationFillMode: activeNode === node.id ? 'none' : 'backwards',
                  }}
                />
                {/* Inner dot — slightly larger so it's visible even against a busy image */}
                <div
                  className="absolute rounded-full transition-colors duration-300"
                  style={{
                    width: 8,
                    height: 8,
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    background:
                      activeNode === node.id ? 'var(--color-threshold)' : 'rgba(245,240,232,0.75)',
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* SVG connector line — spans full section width, drawn from active node to left edge */}
        <svg
          ref={svgRef}
          className="pointer-events-none absolute inset-0 z-10 h-full w-full"
          aria-hidden="true"
        >
          <path
            ref={pathRef}
            stroke="var(--color-threshold)"
            strokeWidth="1"
            fill="none"
            opacity="0"
          />
        </svg>

        {/* ↓ CONTINUE prompt — appears after 8s or after hovering 3+ nodes */}
        {continueVisible && (
          <div
            ref={continueRef}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 text-label text-stone opacity-0"
          >
            ↓ CONTINUE
          </div>
        )}
      </section>
    </div>
  );
}
