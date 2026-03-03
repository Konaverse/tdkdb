import type { Metadata } from 'next';
import InsightsClient from './InsightsClient';
import { getAllInsights } from '@/lib/sanity/queries';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Insights | TDK Design & Build',
  description: 'Perspectives on architecture, construction, and design from TDK Design & Build.',
};

export default async function InsightsPage() {
  const insights = await getAllInsights();

  return <InsightsClient insights={insights} />;
}
