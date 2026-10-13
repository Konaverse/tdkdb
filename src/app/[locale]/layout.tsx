import { DEFAULT_LOCALE } from '@/lib/seo';

/** English is the only published locale. Greek is scaffolded but disabled:
    any other segment is a 404, never a second copy of the English site. */
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ locale: DEFAULT_LOCALE }];
}

export default function LocaleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
