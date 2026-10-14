'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';

import { useConsent } from '@/components/consent/ConsentProvider';
import { clearMetaCookies } from '@/lib/consent';
import { metaPixelId } from '@/lib/meta/config';
import { trackMeta } from '@/lib/meta/pixel';

/* ───────────────────────────────────────────────────────────────────────────
   Meta Pixel, gated by consent.

   The script is rendered only while consent is `granted`, so nothing from
   Meta reaches the page before a choice. Accepting mid-session mounts it then.
   Withdrawing consent revokes the Pixel (`fbq('consent', 'revoke')` is Meta's
   own switch; the loaded script cannot be unloaded) and expires its cookies.

   Events: PageView from the bootstrap on first load and from here on every
   client-side route change; Contact on clicks of tel: and WhatsApp links.
   ViewContent and Lead are fired by the pages and forms that own them.
   ─────────────────────────────────────────────────────────────────────────── */

function bootstrap(pixelId: string): string {
  return `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('consent','grant');fbq('init','${pixelId}');fbq('track','PageView');`;
}

const CONTACT_LINK = /^(tel:|whatsapp:)|wa\.me|whatsapp\.com/i;

export default function MetaPixel() {
  const { consent } = useConsent();
  const pathname = usePathname();
  const pixelId = metaPixelId();
  const active = consent === 'granted' && !!pixelId;
  const lastPath = useRef<string | null>(null);

  // Consent changes after the script has loaded: Meta's own grant/revoke.
  useEffect(() => {
    if (!pixelId || !window.fbq) return;
    if (active) window.fbq('consent', 'grant');
    else {
      window.fbq('consent', 'revoke');
      clearMetaCookies();
    }
  }, [active, pixelId]);

  // PageView on every client-side navigation; the bootstrap covers the first.
  useEffect(() => {
    if (!active) {
      lastPath.current = null;
      return;
    }
    if (lastPath.current === null || lastPath.current === pathname) {
      lastPath.current = pathname;
      return;
    }
    lastPath.current = pathname;
    trackMeta('PageView');
  }, [active, pathname]);

  // Contact: a click on any phone or WhatsApp link, wherever it is.
  useEffect(() => {
    if (!active) return;
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.('a[href]');
      if (link && CONTACT_LINK.test(link.getAttribute('href') || '')) trackMeta('Contact');
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [active]);

  if (!active || !pixelId) return null;

  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {bootstrap(pixelId)}
    </Script>
  );
}
