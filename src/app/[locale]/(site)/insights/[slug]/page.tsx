import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { articles } from '../page';
import ArticleDetailClient from './ArticleDetailClient';
import type { PortableTextBlock } from '@portabletext/types';

const articleBodies: Record<string, PortableTextBlock[]> = {
  'architecture-nicosia': [
    {
      _type: 'block',
      _key: 'a1',
      style: 'h2',
      children: [{ _type: 'span', _key: 's1', text: 'The Changing Face of Nicosia', marks: [] }],
      markDefs: [],
    },
    {
      _type: 'block',
      _key: 'a2',
      style: 'normal',
      children: [
        {
          _type: 'span',
          _key: 's1',
          text: 'Nicosia has long been a city that rewards close attention. On its surface, it can appear fragmented — a legacy of its unusual geopolitical situation, rapid post-war development, and decades of planning decisions that prioritised speed over coherence. But look more carefully, and a different picture emerges.',
          marks: [],
        },
      ],
      markDefs: [],
    },
    {
      _type: 'block',
      _key: 'a3',
      style: 'normal',
      children: [
        {
          _type: 'span',
          _key: 's1',
          text: 'A new generation of developers, architects, and clients is beginning to ask different questions. Not just "how many square metres?" or "what is the yield?" but "what kind of city are we making?" and "what will these buildings feel like in 20 years?"',
          marks: [],
        },
      ],
      markDefs: [],
    },
    {
      _type: 'block',
      _key: 'a4',
      style: 'h2',
      children: [{ _type: 'span', _key: 's1', text: 'Material Honesty', marks: [] }],
      markDefs: [],
    },
    {
      _type: 'block',
      _key: 'a5',
      style: 'normal',
      children: [
        {
          _type: 'span',
          _key: 's1',
          text: 'One of the clearest shifts we are seeing is toward material honesty. Buildings that acknowledge what they are made of. Concrete that looks like concrete. Plaster that shows its texture. Timber that is allowed to weather. This is partly an aesthetic preference, but it is also a practical one — materials that are used truthfully tend to age better than those that are not.',
          marks: [],
        },
      ],
      markDefs: [],
    },
    {
      _type: 'block',
      _key: 'a6',
      style: 'blockquote',
      children: [
        {
          _type: 'span',
          _key: 's1',
          text: 'The best architecture does not age — it matures.',
          marks: [],
        },
      ],
      markDefs: [],
    },
    {
      _type: 'block',
      _key: 'a7',
      style: 'h2',
      children: [{ _type: 'span', _key: 's1', text: 'Outdoor Living as Architecture', marks: [] }],
      markDefs: [],
    },
    {
      _type: 'block',
      _key: 'a8',
      style: 'normal',
      children: [
        {
          _type: 'span',
          _key: 's1',
          text: 'Cyprus has one of the most hospitable climates in Europe for outdoor living — and yet for decades, balconies and terraces were afterthoughts, appended to buildings rather than integrated into them. That is changing. Developers who understand their market are now designing outdoor spaces that genuinely extend the interior: same ceiling height, same material continuity, the same quality of design attention.',
          marks: [],
        },
      ],
      markDefs: [],
    },
  ],
  'construction-management-cyprus': [
    {
      _type: 'block',
      _key: 'b1',
      style: 'h2',
      children: [
        { _type: 'span', _key: 's1', text: 'The Cyprus Construction Landscape', marks: [] },
      ],
      markDefs: [],
    },
    {
      _type: 'block',
      _key: 'b2',
      style: 'normal',
      children: [
        {
          _type: 'span',
          _key: 's1',
          text: 'Construction project management in Cyprus operates within a distinct context. The regulatory environment, the supply chain dynamics, the climatic pressures on programme, the labour market structure — all of these are specific to the island in ways that make direct comparisons to European practice only partially useful.',
          marks: [],
        },
      ],
      markDefs: [],
    },
    {
      _type: 'block',
      _key: 'b3',
      style: 'h2',
      children: [{ _type: 'span', _key: 's1', text: 'Planning and Permitting', marks: [] }],
      markDefs: [],
    },
    {
      _type: 'block',
      _key: 'b4',
      style: 'normal',
      children: [
        {
          _type: 'span',
          _key: 's1',
          text: 'The permitting process in Cyprus has improved significantly over the past decade, but it remains a source of programme risk on virtually every project. A realistic planning programme for a straightforward residential development is 6–12 months from submission to permit. Complex or contentious schemes can take considerably longer.',
          marks: [],
        },
      ],
      markDefs: [],
    },
    {
      _type: 'block',
      _key: 'b5',
      style: 'h2',
      children: [{ _type: 'span', _key: 's1', text: 'Procurement and Supply Chain', marks: [] }],
      markDefs: [],
    },
    {
      _type: 'block',
      _key: 'b6',
      style: 'normal',
      children: [
        {
          _type: 'span',
          _key: 's1',
          text: 'The Cypriot construction supply chain is capable and competitive for standard work. Specialist trades — particularly in high-specification joinery, bespoke glazing, and advanced MEP systems — require either local suppliers with strong manufacturer relationships, or direct importation from mainland Europe, which introduces lead time and logistics complexity.',
          marks: [],
        },
      ],
      markDefs: [],
    },
  ],
  'interior-design-trends': [
    {
      _type: 'block',
      _key: 'c1',
      style: 'h2',
      children: [{ _type: 'span', _key: 's1', text: 'The Return of Natural Materials', marks: [] }],
      markDefs: [],
    },
    {
      _type: 'block',
      _key: 'c2',
      style: 'normal',
      children: [
        {
          _type: 'span',
          _key: 's1',
          text: 'After a decade of high-gloss surfaces and factory-perfect finishes, the pendulum is swinging back. Natural stone, unfired brick, raw timber, and hand-applied plaster are appearing in projects at every price point. The appeal is partly aesthetic — these materials are warm and textural in ways that synthetic alternatives cannot replicate — but it is also about durability and sustainability.',
          marks: [],
        },
      ],
      markDefs: [],
    },
    {
      _type: 'block',
      _key: 'c3',
      style: 'h2',
      children: [{ _type: 'span', _key: 's1', text: 'Quiet Minimalism vs. Maximalism', marks: [] }],
      markDefs: [],
    },
    {
      _type: 'block',
      _key: 'c4',
      style: 'normal',
      children: [
        {
          _type: 'span',
          _key: 's1',
          text: 'The design conversation in 2024 is polarised between two camps. On one side: a continuation of the Nordic-influenced quiet minimalism that has dominated high-end residential design for the past decade. On the other: a more expressive, material-rich approach that takes cues from mid-century modernism, maximalism, and a renewed interest in craft and decoration.',
          marks: [],
        },
      ],
      markDefs: [],
    },
    {
      _type: 'block',
      _key: 'c5',
      style: 'blockquote',
      children: [
        {
          _type: 'span',
          _key: 's1',
          text: 'The most enduring interiors are those that are deeply considered, not just deeply minimal.',
          marks: [],
        },
      ],
      markDefs: [],
    },
    {
      _type: 'block',
      _key: 'c6',
      style: 'h2',
      children: [{ _type: 'span', _key: 's1', text: 'Lighting as Architecture', marks: [] }],
      markDefs: [],
    },
    {
      _type: 'block',
      _key: 'c7',
      style: 'normal',
      children: [
        {
          _type: 'span',
          _key: 's1',
          text: 'The most significant shift in residential interior design in recent years has not been in furniture or surfaces — it has been in lighting. Designers and clients are now approaching artificial lighting with the same rigour previously reserved for architecture: layered schemes, considered control systems, and a deep understanding of how light quality changes the experience of a space.',
          marks: [],
        },
      ],
      markDefs: [],
    },
  ],
};

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = articles.find((a) => a.slug === slug);
  if (!article) return {};
  return {
    title: `${article.title} | TDK Design & Build`,
    description: article.excerpt,
  };
}

export async function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export default async function InsightDetailPage({ params }: Props) {
  const { slug } = await params;
  const article = articles.find((a) => a.slug === slug);
  if (!article) notFound();

  const body = articleBodies[slug] ?? [];
  const related = articles.filter((a) => a.slug !== slug).slice(0, 2);

  return <ArticleDetailClient article={article} body={body} related={related} />;
}
