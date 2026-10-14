'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { clearMetaCookies, readConsent, writeConsent } from '@/lib/consent';

/* One source of truth for consent in the browser. The cookie is read after
   mount, so the server markup never guesses: `ready` is false until then and
   the banner stays unrendered rather than flashing for returning visitors. */

export type ConsentState = 'unknown' | 'granted' | 'denied';

interface ConsentContextValue {
  consent: ConsentState;
  ready: boolean;
  /** The banner was reopened from "Cookie settings". */
  settingsOpen: boolean;
  grant: () => void;
  deny: () => void;
  openSettings: () => void;
  closeSettings: () => void;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentState>('unknown');
  const [ready, setReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    setConsent(readConsent() ?? 'unknown');
    setReady(true);
  }, []);

  const grant = useCallback(() => {
    writeConsent('granted');
    setConsent('granted');
    setSettingsOpen(false);
  }, []);

  const deny = useCallback(() => {
    writeConsent('denied');
    clearMetaCookies();
    setConsent('denied');
    setSettingsOpen(false);
  }, []);

  const value = useMemo<ConsentContextValue>(
    () => ({
      consent,
      ready,
      settingsOpen,
      grant,
      deny,
      openSettings: () => setSettingsOpen(true),
      closeSettings: () => setSettingsOpen(false),
    }),
    [consent, ready, settingsOpen, grant, deny],
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent(): ConsentContextValue {
  const context = useContext(ConsentContext);
  if (!context) throw new Error('useConsent must be used inside ConsentProvider.');
  return context;
}
