'use client';

import type { ReactNode } from 'react';

import { useConsent } from './ConsentProvider';

/** Reopens the consent banner so a visitor can change their choice. */
export default function CookieSettingsButton({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const { openSettings } = useConsent();
  return (
    <button type="button" onClick={openSettings} className={className}>
      {children}
    </button>
  );
}
