import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ArticleDetailClient from './ArticleDetailClient';
import { getInsightBySlug, getAllInsights, getRelatedInsights } from '@/lib/sanity/queries';

export const revalidate = 60;

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getInsightBySlug(slug);
  if (!article) return {};

  return {
    title: article.seo?.title || `${article.title} | TDK Design & Build`,
    description: article.seo?.description || article.excerpt || '',
  };
}

export async function generateStaticParams() {
  const insights = await getAllInsights();
  return insights.map((a) => ({ slug: a.slug.current }));
}

export default async function InsightDetailPage({ params }: Props) {
  const { slug } = await params;
  const article = await getInsightBySlug(slug);
  if (!article) notFound();

  // Fetch up to 2 related insights
  let related = await getRelatedInsights(slug, article.category?._id || '', 2);

  // If no manually curated related insights exist, grab the most recent two in the same category
  if (related.length === 0 && article.category?.slug?.current) {
    const allInsights = await getAllInsights();
    related = allInsights
      .filter((a) => a.slug.current !== slug && a.category?.slug?.current === article.category?.slug?.current)
      .slice(0, 2);
  }

  // If still empty, grab any two recent insights
  if (related.length === 0) {
    const allInsights = await getAllInsights();
    related = allInsights
      .filter((a) => a.slug.current !== slug)
      .slice(0, 2);
  }

  return <ArticleDetailClient article={article} related={related} />;
}
