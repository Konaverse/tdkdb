import Link from 'next/link';
import { projectCard } from '@/lib/cloudinary/transforms';
import { cn } from '@/lib/utils/cn';

export interface ArticleCardData {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  date: string;
  readTime: string;
  heroImageId: string;
}

interface ArticleCardProps {
  article: ArticleCardData;
  className?: string;
  featured?: boolean;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function ArticleCard({ article, className, featured = false }: ArticleCardProps) {
  return (
    <Link href={`/en/insights/${article.slug}`} className={cn('group flex flex-col', className)}>
      {/* Image */}
      <div className={cn('overflow-hidden', featured ? 'aspect-video' : 'aspect-[4/3]')}>
        <img
          src={projectCard(article.heroImageId)}
          alt={article.title}
          className="h-full w-full object-cover transition-transform duration-slow ease-smooth group-hover:scale-[1.03]"
        />
      </div>
      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 pt-5">
        <div className="flex items-center gap-4">
          <span className="text-label text-threshold">{article.category.toUpperCase()}</span>
          <span className="text-label text-stone">{article.readTime}</span>
        </div>
        <h3
          className={cn(
            'text-paper transition-colors duration-fast ease-smooth group-hover:text-threshold',
            featured ? 'text-heading' : 'text-body font-semibold',
          )}
        >
          {article.title}
        </h3>
        <p className="flex-1 text-body text-stone">{article.excerpt}</p>
        <p className="text-label text-stone">{formatDate(article.date)}</p>
      </div>
    </Link>
  );
}
