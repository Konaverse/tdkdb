'use client';

import { useEffect, useRef } from 'react';

import { useConsent } from '@/components/consent/ConsentProvider';
import { trackMetaWhenReady } from '@/lib/meta/pixel';

/** ViewContent for one page, once per visit, as soon as consent allows it. */
export default function MetaViewContent({ name }: { name: string }) {
  const { consent } = useConsent();
  const fired = useRef(false);

  useEffect(() => {
    if (consent !== 'granted' || fired.current) return;
    fired.current = true;
    return trackMetaWhenReady('ViewContent', { content_name: name });
  }, [consent, name]);

  return null;
}
