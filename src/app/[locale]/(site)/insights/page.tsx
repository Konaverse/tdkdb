import type { Metadata } from 'next';
import InsightsClient from './InsightsClient';
import type { ArticleCardData } from '@/components/ui/ArticleCard';

export const metadata: Metadata = {
  title: 'Insights | TDK Design & Build',
  description: 'Perspectives on architecture, construction, and design from TDK Design & Build.',
};

const articles: ArticleCardData[] = [
  {
    slug: 'architecture-nicosia',
    title: 'Architecture in Nicosia Today',
    category: 'Architecture',
    excerpt:
      "Nicosia is experiencing a quiet architectural renaissance. A new generation of developers and designers are pushing the city's built environment in a more considered direction.",
    date: '2024-03-01',
    readTime: '5 min',
    heroImageId: 'clients/tdkdb/armonia/exterior/1',
  },
  {
    slug: 'construction-management-cyprus',
    title: 'Construction Management in Cyprus',
    category: 'Construction',
    excerpt:
      'Managing a construction project in Cyprus requires navigating a specific combination of regulatory, climatic, and supply chain factors. Here is what we have learned.',
    date: '2024-02-15',
    readTime: '4 min',
    heroImageId: 'clients/tdkdb/armonia/exterior/2',
  },
  {
    slug: 'interior-design-trends',
    title: 'Interior Design Trends 2024',
    category: 'Lifestyle',
    excerpt:
      'The interior design trends shaping residential spaces in 2024 — from material palettes to the return of craftsmanship and the persistence of minimalism.',
    date: '2024-01-20',
    readTime: '6 min',
    heroImageId: 'clients/tdkdb/armonia/interior/2',
  },
];

export default function InsightsPage() {
  return <InsightsClient articles={articles} />;
}
