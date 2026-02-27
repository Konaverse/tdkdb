'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { gsap, gsapInit, ScrollTrigger } from '@/lib/animations/gsap';
import PortableText from '@/components/sanity/PortableText';
import ArticleCard, { type ArticleCardData } from '@/components/ui/ArticleCard';
import GridWrapper from '@/components/layout/GridWrapper';
import Section from '@/components/layout/Section';
import FadeUp from '@/components/animations/FadeUp';
import type { PortableTextBlock } from '@portabletext/types';

interface TocItem {
  key: string;
  text: string;
  level: 'h2' | 'h3';
}

function extractToc(blocks: PortableTextBlock[]): TocItem[] {
  return blocks
    .filter((b) => b.style === 'h2' || b.style === 'h3')
    .map((b) => ({
      key: b._key,
      text: (b.children as { text: string }[]).map((c) => c.text).join(''),
      level: b.style as 'h2' | 'h3',
    }));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

interface ArticleDetailClientProps {
  article: ArticleCardData;
  body: PortableTextBlock[];
  related: ArticleCardData[];
}

export default function ArticleDetailClient({ article, body, related }: ArticleDetailClientProps) {
  const toc = extractToc(body);
  const [activeHeading, setActiveHeading] = useState<string>(toc[0]?.key ?? '');
  const articleRef = useRef<HTMLDivElement>(null);

  // TOC scroll tracking via ScrollTrigger
  useLayoutEffect(() => {
    gsapInit();
    if (!articleRef.current || toc.length === 0) return;

    const ctx = gsap.context(() => {
      toc.forEach(({ key }) => {
        const el = document.getElementById(`heading-${key}`);
        if (!el) return;
        ScrollTrigger.create({
          trigger: el,
          start: 'top 30%',
          end: 'bottom 30%',
          onEnter: () => setActiveHeading(key),
          onEnterBack: () => setActiveHeading(key),
        });
      });
    }, articleRef);

    return () => ctx.revert();
  }, [toc.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: article.title, url }).catch(() => undefined);
    } else {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard.');
    }
  };

  return (
    <main className="bg-void text-paper">
      {/* ── Article Hero ── */}
      <section className="pb-16 pt-40">
        <GridWrapper>
          <FadeUp>
            <div className="mb-6 flex flex-wrap items-center gap-4">
              <span className="text-label text-threshold">{article.category.toUpperCase()}</span>
              <span className="text-label text-stone">·</span>
              <span className="text-label text-stone">{article.readTime}</span>
            </div>
          </FadeUp>
          <FadeUp delay={100}>
            <h1 className="mb-8 max-w-3xl text-display-md text-paper">{article.title}</h1>
          </FadeUp>
          <FadeUp delay={200}>
            <div className="flex items-center gap-6 border-t border-border pt-6">
              <div>
                <p className="text-label text-stone">TDK DESIGN & BUILD</p>
                <p className="text-body text-stone">{formatDate(article.date)}</p>
              </div>
              <button
                type="button"
                onClick={handleShare}
                className="ml-auto text-label text-stone transition-colors duration-fast ease-smooth hover:text-paper"
              >
                SHARE →
              </button>
            </div>
          </FadeUp>
        </GridWrapper>
      </section>

      {/* ── Article Body + TOC ── */}
      <Section>
        <GridWrapper>
          <div className="relative grid gap-16 lg:grid-cols-[1fr_280px]">
            {/* Body */}
            <div ref={articleRef} className="min-w-0">
              <PortableText value={body} />
            </div>

            {/* TOC — sticky sidebar on desktop */}
            {toc.length > 0 && (
              <aside className="hidden lg:block">
                <div className="sticky top-24">
                  <p className="mb-4 text-label text-stone">CONTENTS</p>
                  <nav className="flex flex-col gap-2">
                    {toc.map(({ key, text, level }) => (
                      <a
                        key={key}
                        href={`#heading-${key}`}
                        className={`block text-body transition-colors duration-fast ease-smooth ${
                          level === 'h3' ? 'pl-4' : ''
                        } ${
                          activeHeading === key ? 'text-threshold' : 'text-stone hover:text-paper'
                        }`}
                      >
                        {text}
                      </a>
                    ))}
                  </nav>
                </div>
              </aside>
            )}
          </div>
        </GridWrapper>
      </Section>

      {/* ── Author Bio ── */}
      <Section background="surface">
        <GridWrapper>
          <FadeUp>
            <div className="flex items-start gap-6">
              <div className="h-16 w-16 flex-shrink-0 bg-void" />
              <div>
                <p className="text-label text-paper">TDK DESIGN & BUILD</p>
                <p className="mt-2 text-body text-stone">
                  TDK Design &amp; Build is a fully integrated architecture, construction, and
                  interior design studio based in Nicosia, Cyprus.
                </p>
              </div>
            </div>
          </FadeUp>
        </GridWrapper>
      </Section>

      {/* ── Related Articles ── */}
      {related.length > 0 && (
        <Section>
          <GridWrapper>
            <FadeUp>
              <p className="mb-12 text-label text-stone">MORE INSIGHTS</p>
            </FadeUp>
            <div className="grid gap-12 sm:grid-cols-2">
              {related.map((a, i) => (
                <FadeUp key={a.slug} delay={i * 80}>
                  <ArticleCard article={a} />
                </FadeUp>
              ))}
            </div>
          </GridWrapper>
        </Section>
      )}
    </main>
  );
}
