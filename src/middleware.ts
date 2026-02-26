import { NextRequest, NextResponse } from 'next/server';

const locales = ['en', 'el'];
const defaultLocale = 'en';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Pass static assets directly — do not locale-redirect them
  if (pathname.startsWith('/sequences/') || pathname.startsWith('/videos/')) {
    return NextResponse.next();
  }

  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  if (pathnameHasLocale) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!api|studio|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|sequences|videos).*)'],
};
