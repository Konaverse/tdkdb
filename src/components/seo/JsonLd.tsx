import { jsonLdString, type JsonLd as JsonLdData } from '@/lib/seo';

/** One structured-data block. Server component; render it anywhere in a page. */
export default function JsonLd({ data }: { data: JsonLdData }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(data) }} />
  );
}
