'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { usePathname } from 'next/navigation';

export type IntroPhase = 'loading' | 'reveal' | 'done';

interface IntroContextValue {
  phase: IntroPhase;
  setPhase: (p: IntroPhase) => void;
}

const IntroContext = createContext<IntroContextValue>({
  phase: 'done',
  setPhase: () => {},
});

export const useIntro = () => useContext(IntroContext);

/** `/en` (locale only) is the homepage. Interior pages have 2+ segments. */
function isHomePath(pathname: string | null): boolean {
  if (!pathname) return false;
  const segments = pathname.replace(/\/+$/, '').split('/').filter(Boolean);
  return segments.length === 1;
}

export default function IntroProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Decided once, at first mount: the full loader intro runs only on a hard
  // load that lands on the homepage. Client-side navigations keep this provider
  // mounted, so returning to home later won't replay the loader.
  const [phase, setPhaseState] = useState<IntroPhase>(() =>
    isHomePath(pathname) ? 'loading' : 'done',
  );
  const setPhase = useCallback((p: IntroPhase) => setPhaseState(p), []);

  return <IntroContext.Provider value={{ phase, setPhase }}>{children}</IntroContext.Provider>;
}
