'use client';

import { useLayoutEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { StaticImageData } from 'next/image';
import { useParams, usePathname } from 'next/navigation';

import { gsap, gsapInit, ScrollTrigger } from '@/lib/animations/gsap';
import { maskChars, riseIn, nearViewport } from '@/lib/animations/text';
import { usesMobileMotion } from '@/lib/animations/mobile';
import { LightboxTrigger } from '@/components/ui/ImageLightbox';
import type { SiteSettings } from '@/lib/sanity/types';
import SocialGlyph from '@/components/ui/SocialGlyph';
import styles from './FooterClient.module.css';

const COMPANY_LINKS = [
  { label: 'Home', path: '' },
  { label: 'About us', path: 'about' },
  { label: 'Our projects', path: 'projects' },
  { label: 'Contact us', path: 'contact' },
];

interface Props {
  backdrop: StaticImageData;
  settings: SiteSettings | null;
}

/** A white index followed by one photograph, visible through the wordmark
 * and in the full-width image below it, as in the supplied reference.
 */
export default function FooterClient({ settings, backdrop }: Props) {
  const params = useParams();
  const pathname = usePathname();
  const locale = (params?.locale as string) ?? 'en';
  const href = (path: string) => (path ? `/${locale}/${path}` : `/${locale}`);
  const source = backdrop.src;

  const rootRef = useRef<HTMLElement>(null);
  const artRef = useRef<HTMLDivElement>(null);
  const wordmarkRef = useRef<HTMLSpanElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const email = settings?.email;
  const phone = settings?.phone;
  const address = settings?.address;
  const socials = settings?.socialLinks ?? [];

  useLayoutEffect(() => {
    gsapInit();
    const root = rootRef.current;
    const art = artRef.current;
    const wordmark = wordmarkRef.current;
    const photo = photoRef.current;
    const image = imageRef.current;
    if (!root || !art || !wordmark || !photo || !image) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let alive = true;
    let ctx: gsap.Context | null = null;
    let observer: ResizeObserver | null = null;
    let parallax: ScrollTrigger | null = null;
    let motion: gsap.MatchMedia | null = null;
    let frame = 0;
    let travel = 0;
    let backgroundX = 0;
    let backgroundY = 0;
    let progress = 0;
    let shiftImage: (offset: number) => void = () => {};

    // Both views of the photograph share one offset. The white content and
    // letter shapes stay in normal flow while the room moves behind them.
    const render = () => {
      const offset = progress * travel;
      shiftImage(offset);
      wordmark.style.backgroundPosition = `${backgroundX}px ${backgroundY + offset}px`;
    };

    const paint = () => {
      if (!alive) return;
      // Fit the visible brand name to the page margins on every viewport.
      const available = wordmark.parentElement!.clientWidth;
      const width = wordmark.offsetWidth;
      if (width && Math.abs(available - width) > 0.75) {
        const fontSize = parseFloat(getComputedStyle(wordmark).fontSize);
        root.style.setProperty(
          '--footer-wordmark-size',
          `${((fontSize * available) / width).toFixed(3)}px`,
        );
      }

      const artRect = art.getBoundingClientRect();
      const wordmarkRect = wordmark.getBoundingClientRect();
      const photoRect = photo.getBoundingClientRect();
      const w = artRect.width;
      const h = artRect.height;
      const aspect = image.naturalWidth ? image.naturalWidth / image.naturalHeight : 16 / 9;
      travel = reduced || usesMobileMotion() ? 0 : Math.min(220, Math.max(80, h * 0.32));
      // Extra image height covers the full motion range. It starts raised
      // behind the lettering, then travels down as the footer scrolls up.
      const imageWidth = Math.max(w, (h + travel) * aspect);
      const imageHeight = imageWidth / aspect;
      const x = (w - imageWidth) / 2;
      // Anchor the room to its floor, so both the lettering and the image
      // show the living space rather than the ceiling.
      const y = h - imageHeight;

      art.style.setProperty('--footer-image-width', `${imageWidth}px`);
      art.style.setProperty('--footer-image-height', `${imageHeight}px`);
      art.style.setProperty('--footer-image-x', `${x}px`);
      art.style.setProperty('--footer-photo-y', `${y - (photoRect.top - artRect.top)}px`);
      wordmark.style.backgroundSize = `${imageWidth}px ${imageHeight}px`;
      backgroundX = x - (wordmarkRect.left - artRect.left);
      backgroundY = y - (wordmarkRect.top - artRect.top);
      render();
    };

    const schedulePaint = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        paint();
        parallax?.refresh();
      });
    };

    paint();
    image.addEventListener('load', schedulePaint);

    document.fonts.ready.then(() => {
      if (!alive) return;
      ctx = gsap.context(() => {
        paint();
        if (!reduced) {
          motion = gsap.matchMedia();
          motion.add('(min-width: 1024px) and (hover: hover) and (pointer: fine)', () => {
            gsap.set(image, { y: 0, force3D: true });
            const setImageY = gsap.quickSetter(image, 'y', 'px');
            shiftImage = (offset) => setImageY(offset);
            const syncScroll = (trigger: ScrollTrigger) => {
              progress = trigger.progress;
              render();
            };
            parallax = ScrollTrigger.create({
              trigger: art,
              start: 'top bottom',
              end: 'bottom bottom',
              onUpdate: syncScroll,
              onRefresh: syncScroll,
            });
            paint();
            return () => {
              parallax = null;
              progress = 0;
              shiftImage = () => {};
              paint();
            };
          });
        }
        if (!reduced) {
          const q = gsap.utils.selector(root);
          q('[data-footer-column]').forEach((column) =>
            nearViewport(column, () => {
              const text = maskChars(column.querySelectorAll('[data-footer-text]'));
              gsap.to(
                text.chars,
                riseIn(text.chars, {
                  scrollTrigger: { trigger: column, start: 'top 92%', once: true },
                  onComplete: () => text.split.revert(),
                }),
              );
            }),
          );
        }
        paint();
      }, root);
      observer = new ResizeObserver(schedulePaint);
      observer.observe(root);
      observer.observe(art);
      schedulePaint();
    });

    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      observer?.disconnect();
      image.removeEventListener('load', schedulePaint);
      motion?.revert();
      ctx?.revert();
    };
  }, [source, email, phone, address, pathname]);

  return (
    <footer id="site-footer" ref={rootRef} data-nav="light" className={styles.footer}>
      <div className={styles.index}>
        <div data-footer-column className={styles.brand}>
          <Link href={href('')} className={styles.brandName} aria-label="TDK Design & Build home">
            <span data-footer-text>TDK Design &amp; Build</span>
          </Link>
          <p data-footer-text className={styles.intro}>
            Find your place to call home.
            <br />
            Thoughtfully designed.
            <br />
            Built by TDK.
          </p>
          <Link href={href('projects/almond-suites#register-interest')} className={styles.cta}>
            <span data-footer-text className="button-label">
              Register interest
            </span>
          </Link>
        </div>

        <nav data-footer-column aria-label="Footer company" className={styles.column}>
          <h2 data-footer-text className={styles.heading}>
            Company
          </h2>
          <ul className={styles.links}>
            {COMPANY_LINKS.map((link) => (
              <li key={link.label}>
                <Link href={href(link.path)} className={styles.link} aria-label={link.label}>
                  <span data-footer-text>{link.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div data-footer-column className={styles.column}>
          <h2 data-footer-text className={styles.heading}>
            Get in touch
          </h2>
          <address className={styles.contact}>
            {email && (
              <a href={`mailto:${email}`} className={styles.link}>
                <span data-footer-text>{email}</span>
              </a>
            )}
            {phone && (
              <a href={`tel:${phone.replace(/\s+/g, '')}`} className={styles.link}>
                <span data-footer-text>{phone}</span>
              </a>
            )}
            {address && (
              <p data-footer-text className={styles.address}>
                {address}
              </p>
            )}
          </address>
          {socials.length > 0 && (
            <ul className={styles.socials} aria-label="Social media">
              {socials.map((social) => (
                <li key={social.url}>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.platform}
                    className={styles.social}
                  >
                    <SocialGlyph platform={social.platform} />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav
          data-footer-column
          aria-label="Footer legal"
          className={`${styles.column} ${styles.legal}`}
        >
          <h2 data-footer-text className={styles.heading}>
            Legal
          </h2>
          <ul className={styles.links}>
            <li>
              <Link href={href('privacy-policy')} className={styles.link}>
                <span data-footer-text>Privacy policy</span>
              </Link>
            </li>
            <li>
              <Link href={href('terms')} className={styles.link}>
                <span data-footer-text>Terms &amp; conditions</span>
              </Link>
            </li>
            <li className={styles.credit}>
              <span data-footer-text>© {new Date().getFullYear()} TDK</span>
            </li>
            <li>
              <a
                href="https://www.kona-verse.com"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                <span data-footer-text>Design by Konaverse</span>
              </a>
            </li>
          </ul>
        </nav>
      </div>

      <div ref={artRef} className={styles.art}>
        <div className={styles.wordmarkRow} aria-hidden="true">
          <div className={styles.wordmarkFrame}>
            <span
              ref={wordmarkRef}
              data-footer-wordmark
              className={`${styles.wordmark} ${source ? styles.imageText : ''}`}
              style={source ? { backgroundImage: `url(${source})` } : undefined}
            >
              TDK DESIGN &amp; BUILD
            </span>
          </div>
        </div>
        {source && (
          <div
            ref={photoRef}
            data-nav="dark"
            data-footer-photo
            data-lightbox="footer"
            className={styles.photo}
          >
            <Image
              ref={imageRef}
              src={source}
              width={backdrop.width}
              height={backdrop.height}
              unoptimized
              alt="Living room and kitchen of TDK's two-bedroom Modular residence"
              loading="lazy"
              decoding="async"
              className={styles.image}
            />
            <LightboxTrigger label="View Modular residence photograph" />
          </div>
        )}
      </div>
    </footer>
  );
}
