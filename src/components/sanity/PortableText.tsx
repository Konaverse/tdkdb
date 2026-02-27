import {
  PortableText as ReactPortableText,
  type PortableTextComponents,
} from '@portabletext/react';
import type { PortableTextBlock } from '@portabletext/types';
import { cloudinaryUrl } from '@/lib/cloudinary/transforms';

interface PortableTextProps {
  value: PortableTextBlock[];
}

const components: PortableTextComponents = {
  block: {
    h2: ({ children, value }) => (
      <h2
        id={`heading-${(value as { _key?: string })._key ?? ''}`}
        className="mb-4 mt-12 scroll-mt-24 text-heading text-paper"
        data-heading="h2"
      >
        {children}
      </h2>
    ),
    h3: ({ children, value }) => (
      <h3
        id={`heading-${(value as { _key?: string })._key ?? ''}`}
        className="mb-3 mt-8 scroll-mt-24 text-body font-semibold text-paper"
        data-heading="h3"
      >
        {children}
      </h3>
    ),
    normal: ({ children }) => <p className="mb-6 text-body-lg text-stone">{children}</p>,
    blockquote: ({ children }) => (
      <blockquote className="my-8 border-l-2 border-threshold pl-6 text-body-lg italic text-stone">
        {children}
      </blockquote>
    ),
  },
  marks: {
    link: ({ children, value }) => (
      <a
        href={(value as { href?: string }).href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-threshold underline underline-offset-2 hover:text-paper"
      >
        {children}
      </a>
    ),
    code: ({ children }) => (
      <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-sm text-threshold">
        {children}
      </code>
    ),
  },
  types: {
    image: ({ value }) => {
      const publicId = (value as { publicId?: string }).publicId;
      if (!publicId) return null;
      return (
        <figure className="my-8">
          <img
            src={cloudinaryUrl(publicId, { width: 1200 })}
            alt={(value as { alt?: string }).alt ?? ''}
            className="w-full"
          />
          {(value as { caption?: string }).caption && (
            <figcaption className="mt-2 text-label text-stone">
              {(value as { caption?: string }).caption}
            </figcaption>
          )}
        </figure>
      );
    },
    code: ({ value }) => (
      <pre className="my-6 overflow-x-auto bg-surface p-6 font-mono text-sm text-paper">
        <code>{(value as { code?: string }).code}</code>
      </pre>
    ),
  },
};

export default function PortableText({ value }: PortableTextProps) {
  return <ReactPortableText value={value} components={components} />;
}
