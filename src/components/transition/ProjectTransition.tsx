'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { CustomEase, gsap, gsapInit, ScrollTrigger } from '@/lib/animations/gsap';
import { getLenis } from '@/lib/animations/lenis';
import { projectHeroUrl, projectHeroWidthFor } from '@/lib/sanity/image';
import type { SanityImage } from '@/lib/sanity/types';

/* ───────────────────────────────────────────────────────────────────────────
   ProjectTransition — a project's photograph carried from the homepage onto
   its own page.

   THE MOTION
   Click a frame in the projects section: a white veil rises over the page
   while the photograph, lifted out of its frame onto a fixed layer, opens
   into a full-bleed picture. The route changes only once the picture fills
   the screen, and the project hero underneath renders that same picture at
   the same size, so taking the layer away is invisible. Then the hero's copy
   and the navbar arrive.

   WHY IT IS BUILT THIS WAY
   · It lives in the (site) layout, which survives client navigation. The
     homepage unmounts under it; the layer does not.
   · Navigate AFTER the expansion. Unmounting the homepage (pins, triggers,
     the whole tree) and mounting the project page is main-thread work; done
     mid-expansion it is a visible jump in a JS-driven tween. Done while the
     picture sits still at full bleed it costs nothing visible. The scroll is
     reset in the same still moment.
   · View Transitions were considered and passed over: Next 14 has no hook
     into the router commit, the snapshot cannot follow a GSAP ease, and
     Lenis plus pinned sections fight the capture.
   · Geometry is one progress value. The window is a clip (a fixed box with
     overflow hidden, translated and scaled from the frame's rect to the
     viewport's); the picture inside is a box at the source's natural aspect
     whose rect goes from the thumbnail's object-cover box to the viewport's.
     Both are linear in the same eased t, so if the picture covers the window
     at both ends it covers it at every frame. The clip's scale is
     non-uniform; the picture takes the inverse, so it is never distorted.
   · The first pixels of the layer are the thumbnail's own decoded image
     (currentSrc), so the lift is exact. The hero-size image decodes in
     parallel and cross-fades in; the hero asks for the identical URL.
   · A slight breath (a ≤5% zoom about the window's centre, zero at both
     ends) keeps the picture from feeling pasted onto the growing window.
     A zoom ≥ 1 about a point inside the window cannot uncover it.
   ─────────────────────────────────────────────────────────────────────────── */

export interface TransitionStart {
  href: string;
  slug: string;
  /** The project's hero image, as the page will render it. */
  image_source: SanityImage;
  /** The clicked frame — the window opens from its rect. */
  frame: HTMLElement;
  /** The photograph as rendered in it, pan included. */
  image: HTMLImageElement;
}

export interface Arrival {
  slug: string;
  /** The hero must render exactly this URL. */
  src: string;
}

interface TransitionApi {
  /** False when the caller should navigate plainly. */
  start: (s: TransitionStart) => boolean;
  /** Read once at the hero's first render. */
  claim: (slug: string) => Arrival | null;
  /** The hero's picture is decoded and in place; resolves once the layer is
      gone and the copy may enter. */
  handoff: (slug: string, hero: HTMLElement) => Promise<void>;
}

const TransitionContext = createContext<TransitionApi>({
  start: () => false,
  claim: () => null,
  handoff: () => Promise.resolve(),
});

export const useProjectTransition = () => useContext(TransitionContext);

/* ── timing ── */
const EXPAND = 1.45;
/** Moving from the first frame (4% by 200ms, where power4.inOut is still at
    0.3% and the click feels ignored), fastest just before the middle, then a
    long settle onto full bleed. */
const EXPAND_CURVE = 'M0,0 C0.6,0.08 0.1,1 1,1';
const VEIL = 0.8;
const BREATH = 0.05;
/** How long the full-bleed picture may wait for the page before giving up. */
const ARRIVAL_TIMEOUT = 12000;

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const coverBox = (win: Box, aspect: number): Box => {
  const w = Math.max(win.w, win.h * aspect);
  const h = w / aspect;
  return { x: win.x + (win.w - w) / 2, y: win.y + (win.h - h) / 2, w, h };
};

const lerpBox = (a: Box, b: Box, t: number): Box => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  w: a.w + (b.w - a.w) * t,
  h: a.h + (b.h - a.h) * t,
});

const toBox = (r: DOMRect): Box => ({ x: r.left, y: r.top, w: r.width, h: r.height });

/** Resolves once the main thread delivers SETTLE_FRAMES smooth frames in a
    row, or after SETTLE_MAX ms regardless. */
const SETTLE_FRAMES = 3;
const SETTLE_MAX = 900;
const settled = () =>
  new Promise<void>((resolve) => {
    const t0 = performance.now();
    let last = t0;
    let run = 0;
    const tick = (now: number) => {
      run = now - last < 22 ? run + 1 : 0;
      last = now;
      if (run >= SETTLE_FRAMES || now - t0 > SETTLE_MAX) resolve();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

interface Run {
  id: number;
  slug: string;
  href: string;
  /** The path the run started on. */
  from: string;
  src: string;
  aspect: number;
  /** Clip base size: the viewport the layer was laid out for. */
  baseW: number;
  baseH: number;
  /** Picture base size: its cover box at the end. */
  mediaW: number;
  mediaH: number;
  /** Where the window and the picture are now. */
  win: Box;
  pic: Box;
  navigated: boolean;
  expanded: Promise<void>;
  hiShown: Promise<void>;
  timeout?: ReturnType<typeof setTimeout>;
  tl?: gsap.core.Timeline;
}

export default function ProjectTransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const veilRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const loRef = useRef<HTMLImageElement>(null);
  const hiRef = useRef<HTMLImageElement>(null);
  const probeRef = useRef<HTMLDivElement>(null);

  const runRef = useRef<Run | null>(null);
  const idRef = useRef(0);
  const pathRef = useRef(pathname);

  /** The single writer of the layer's two transforms. */
  const write = useCallback((run: Run, win: Box, pic: Box) => {
    const layer = layerRef.current;
    const media = mediaRef.current;
    if (!layer || !media) return;
    run.win = win;
    run.pic = pic;
    const sx = win.w / run.baseW;
    const sy = win.h / run.baseH;
    layer.style.transform = `translate3d(${win.x}px, ${win.y}px, 0) scale(${sx}, ${sy})`;
    const s = pic.w / run.mediaW;
    media.style.transform = `translate3d(${(pic.x - win.x) / sx}px, ${(pic.y - win.y) / sy}px, 0) scale(${s / sx}, ${s / sy})`;
  }, []);

  /** Put everything back as if nothing had happened. */
  const reset = useCallback(() => {
    const run = runRef.current;
    if (!run) return;
    run.tl?.kill();
    clearTimeout(run.timeout);
    runRef.current = null;
    const layer = layerRef.current;
    const veil = veilRef.current;
    const hi = hiRef.current;
    const lo = loRef.current;
    if (layer) {
      gsap.killTweensOf(layer);
      layer.style.opacity = '';
      layer.style.visibility = 'hidden';
    }
    if (veil) {
      gsap.killTweensOf(veil);
      gsap.set(veil, { autoAlpha: 0 });
    }
    if (hi) {
      gsap.killTweensOf(hi);
      hi.style.opacity = '0';
      hi.removeAttribute('src');
    }
    if (lo) lo.removeAttribute('src');
    getLenis()?.start();
  }, []);

  const start = useCallback<TransitionApi['start']>(
    ({ href, slug, image_source, frame, image }) => {
      if (runRef.current) return true; // one at a time; swallow the second click
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;

      const layer = layerRef.current;
      const media = mediaRef.current;
      const veil = veilRef.current;
      const lo = loRef.current;
      const hi = hiRef.current;
      const probe = probeRef.current;
      if (!layer || !media || !veil || !lo || !hi || !probe) return false;
      if (!image.naturalWidth || !image.naturalHeight) return false;

      gsapInit();
      getLenis()?.stop();
      const ease =
        CustomEase.get('projectExpand') || CustomEase.create('projectExpand', EXPAND_CURVE);

      const aspect = image.naturalWidth / image.naturalHeight;
      const vw = document.documentElement.clientWidth;
      // 100svh, the hero's height, measured rather than assumed.
      const vh = probe.offsetHeight || window.innerHeight;
      const endWin: Box = { x: 0, y: 0, w: vw, h: vh };
      const endPic = coverBox(endWin, aspect);

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const src = projectHeroUrl(image_source, projectHeroWidthFor(endPic.w * dpr));

      const startWin = toBox(frame.getBoundingClientRect());
      const startPic = coverBox(toBox(image.getBoundingClientRect()), aspect);

      const id = ++idRef.current;
      let resolveExpanded!: () => void;
      const run: Run = {
        id,
        slug,
        href,
        from: pathRef.current,
        src,
        aspect,
        baseW: vw,
        baseH: vh,
        mediaW: endPic.w,
        mediaH: endPic.h,
        win: startWin,
        pic: startPic,
        navigated: false,
        expanded: new Promise<void>((r) => (resolveExpanded = r)),
        hiShown: Promise.resolve(),
      };
      runRef.current = run;

      // Lay the layer out at its end size; transforms carry it back to the frame.
      layer.style.width = `${vw}px`;
      layer.style.height = `${vh}px`;
      media.style.width = `${endPic.w}px`;
      media.style.height = `${endPic.h}px`;
      lo.src = image.currentSrc || image.src;
      write(run, startWin, startPic);
      layer.style.visibility = 'visible';

      // The hero-size picture: decode now, fade in when ready.
      hi.style.opacity = '0';
      hi.src = src;
      run.hiShown = hi
        .decode()
        .catch(() => {})
        .then(
          () =>
            new Promise<void>((resolve) => {
              if (runRef.current?.id !== id) return resolve();
              gsap.to(hi, {
                opacity: 1,
                duration: 0.45,
                ease: 'power1.inOut',
                onComplete: resolve,
              });
            }),
        );

      const t = { p: 0 };
      const tl = gsap.timeline();
      run.tl = tl;
      tl.to(veil, { autoAlpha: 1, duration: VEIL, ease: 'power2.inOut' }, 0.05);
      tl.to(
        t,
        {
          p: 1,
          duration: EXPAND,
          ease,
          onUpdate: () => {
            const win = lerpBox(startWin, endWin, t.p);
            const pic = lerpBox(startPic, endPic, t.p);
            const k = 1 + BREATH * Math.sin(Math.PI * t.p);
            const cx = win.x + win.w / 2;
            const cy = win.y + win.h / 2;
            write(run, win, {
              x: cx + (pic.x - cx) * k,
              y: cy + (pic.y - cy) * k,
              w: pic.w * k,
              h: pic.h * k,
            });
          },
        },
        0,
      );
      tl.call(() => {
        if (runRef.current?.id !== id) return;
        write(run, endWin, endPic);
        resolveExpanded();
        // Everything under the layer is hidden now: reset the scroll and
        // change the route in this still moment.
        getLenis()?.scrollTo(0, { immediate: true, force: true });
        window.scrollTo(0, 0);
        run.navigated = true;
        router.push(href, { scroll: false });
        run.timeout = setTimeout(() => {
          if (runRef.current?.id !== id) return;
          gsap.to([layer, veil], { autoAlpha: 0, duration: 0.5, onComplete: reset });
        }, ARRIVAL_TIMEOUT);
      });

      return true;
    },
    [router, write, reset],
  );

  const claim = useCallback<TransitionApi['claim']>((slug) => {
    const run = runRef.current;
    return run && run.slug === slug ? { slug, src: run.src } : null;
  }, []);

  const handoff = useCallback<TransitionApi['handoff']>(
    async (slug, hero) => {
      const run = runRef.current;
      if (!run || run.slug !== slug) return;
      const { id } = run;
      clearTimeout(run.timeout);

      await run.expanded;
      await run.hiShown;
      if (runRef.current?.id !== id) return;

      // The new page is still settling in under the picture: effects,
      // triggers, image decodes. Take that cost here, while nothing on screen
      // moves, rather than in the first frames of the copy's entrance.
      ScrollTrigger.refresh();
      await settled();
      if (runRef.current?.id !== id) return;

      // The hero is 100svh by 100% — normally the box we opened to. If the
      // browser chrome moved in the meantime, glide onto the real box.
      const target = toBox(hero.getBoundingClientRect());
      const off = Math.max(
        Math.abs(target.x - run.win.x),
        Math.abs(target.y - run.win.y),
        Math.abs(target.w - run.win.w),
        Math.abs(target.h - run.win.h),
      );
      if (off > 1) {
        const fromWin = run.win;
        const fromPic = run.pic;
        const toPic = coverBox(target, run.aspect);
        const t = { p: 0 };
        await new Promise<void>((resolve) => {
          gsap.to(t, {
            p: 1,
            duration: 0.35,
            ease: 'power2.out',
            onUpdate: () => write(run, lerpBox(fromWin, target, t.p), lerpBox(fromPic, toPic, t.p)),
            onComplete: resolve,
          });
        });
        if (runRef.current?.id !== id) return;
      }

      // The navbar was under the veil; it arrives with the copy instead of
      // popping in when the veil goes.
      const header = document.querySelector<HTMLElement>('[data-site-header]');
      if (header) gsap.set(header, { autoAlpha: 0 });

      reset();

      if (header) {
        gsap.to(header, { autoAlpha: 1, duration: 0.8, delay: 0.55, ease: 'power2.out' });
      }
    },
    [reset, write],
  );

  // A navigation that is not ours (the back button mid-flight) abandons the
  // run: before our push the path must stay where we left from, after it,
  // where we were going.
  useEffect(() => {
    pathRef.current = pathname;
    const run = runRef.current;
    if (run && pathname !== (run.navigated ? run.href : run.from)) reset();
  }, [pathname, reset]);

  useEffect(() => reset, [reset]);

  const api = useMemo<TransitionApi>(() => ({ start, claim, handoff }), [start, claim, handoff]);

  return (
    <TransitionContext.Provider value={api}>
      {children}

      {/* The veil: the page fades to white under the growing picture. It
          also swallows clicks for the length of the run. */}
      <div
        ref={veilRef}
        aria-hidden="true"
        className="fixed inset-0 z-[480]"
        style={{ background: '#ffffff', opacity: 0, visibility: 'hidden' }}
      />

      {/* The window and the picture. Laid out at the end size, carried by
          transforms; write() is the only thing that moves them. */}
      <div
        ref={layerRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[490] overflow-hidden"
        style={{ visibility: 'hidden', transformOrigin: '0 0', background: '#0d0d0d' }}
      >
        <div ref={mediaRef} className="absolute left-0 top-0" style={{ transformOrigin: '0 0' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={loRef} alt="" className="absolute inset-0 h-full w-full object-cover" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={hiRef}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{ opacity: 0 }}
          />
        </div>
      </div>

      <div
        ref={probeRef}
        aria-hidden="true"
        className="pointer-events-none invisible fixed left-0 top-0 w-0"
        style={{ height: '100svh' }}
      />
    </TransitionContext.Provider>
  );
}
