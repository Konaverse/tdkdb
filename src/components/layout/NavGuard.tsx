'use client';

/**
 * NavGuard — thin client shell kept for future conditional nav logic.
 * Currently renders children on all routes including the homepage.
 */
export default function NavGuard({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
