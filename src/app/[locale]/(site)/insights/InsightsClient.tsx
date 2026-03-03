'use client';

import { useState } from 'react';
import Section from '@/components/layout/Section';
import GridWrapper from '@/components/layout/GridWrapper';
import TextReveal from '@/components/animations/TextReveal';
import FadeUp from '@/components/animations/FadeUp';
import ArticleCard, { type ArticleCardData } from '@/components/ui/ArticleCard';
import CategoryFilter from '@/components/ui/CategoryFilter';

import type { Insight } from '@/lib/sanity/types';

interface InsightsClientProps {
  insights: Insight[];
}

export default function InsightsClient({ insights }: InsightsClientProps) {
  const [activeCategory, setActiveCategory] = useState('All');

  // Map Sanity insight to ArticleCardData
  const mappedArticles: ArticleCardData[] = insights.map((insight) => ({
    slug: insight.slug.current,
    title: insight.title,
    category: insight.category?.title || 'Uncategorized',
    excerpt: insight.excerpt || '',
    date: insight.publishDate || new Date().toISOString(),
    readTime: '5 min read', // Hardcoded calculation for now
    heroImageId: insight.heroImageId || '',
  }));

  // Extract unique categories directly from data
  const dynamicCategories = ['All', ...Array.from(new Set(mappedArticles.map((a) => a.category)))];

  const filtered = mappedArticles.filter(
    (a) => activeCategory === 'All' || a.category === activeCategory,
  );

  const featured = filtered[0];
  const grid = filtered.slice(1);

  return (
    <main className="bg-void text-paper">
      {/* ── Hero ── */}
      <section className="flex min-h-[50vh] items-end pb-24 pt-40">
        <GridWrapper>
          <p className="mb-4 text-label text-stone">PERSPECTIVES</p>
          <TextReveal tag="h1" className="max-w-3xl text-display-lg text-paper">
            INSIGHTS ON ARCHITECTURE & DESIGN.
          </TextReveal>
        </GridWrapper>
      </section>

      {/* ── Filter ── */}
      <Section>
        <GridWrapper>
          <CategoryFilter
            categories={dynamicCategories}
            active={activeCategory}
            onChange={setActiveCategory}
            className="mb-16"
          />

          {filtered.length === 0 && (
            <p className="text-body text-stone">No articles in this category yet.</p>
          )}

          {/* Featured article */}
          {featured && (
            <FadeUp className="mb-16">
              <ArticleCard article={featured} featured />
            </FadeUp>
          )}

          {/* Grid of remaining articles */}
          {grid.length > 0 && (
            <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
              {grid.map((article, i) => (
                <FadeUp key={article.slug} delay={i * 80}>
                  <ArticleCard article={article} />
                </FadeUp>
              ))}
            </div>
          )}
        </GridWrapper>
      </Section>
    </main>
  );
}
