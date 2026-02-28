import type { Metadata } from 'next';
import InsightsClient from './InsightsClient';
import { articles } from './data';

export const metadata: Metadata = {
  title: 'Insights | TDK Design & Build',
  description: 'Perspectives on architecture, construction, and design from TDK Design & Build.',
};

export default function InsightsPage() {
  return <InsightsClient articles={articles} />;
}
