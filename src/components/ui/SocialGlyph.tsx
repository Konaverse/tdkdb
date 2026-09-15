/* Social glyphs — marks drawn in currentColor, sized by their parent.
   Shared by the hero's social discs and the footer. */

export default function SocialGlyph({ platform }: { platform: string }) {
  const key = platform.toLowerCase();

  if (key.includes('instagram')) {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-full w-full"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.3" cy="6.7" r="0.9" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (key.includes('facebook')) {
    return (
      <svg viewBox="0 0 24 24" className="h-full w-full" fill="currentColor">
        <path d="M13.5 21v-7.3h2.5l.4-3h-2.9V8.9c0-.9.3-1.5 1.5-1.5h1.5V4.8c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.2H8.1v3h2.5V21h2.9z" />
      </svg>
    );
  }
  if (key.includes('linkedin')) {
    return (
      <svg viewBox="0 0 24 24" className="h-[92%] w-[92%]" fill="currentColor">
        <path d="M6.9 8.7H3.6V20h3.3V8.7zM5.3 3.5a1.9 1.9 0 100 3.8 1.9 1.9 0 000-3.8zM20.4 13.1c0-3.2-1.7-4.7-4-4.7-1.8 0-2.7 1-3.1 1.7V8.7H10V20h3.3v-5.6c0-1.5.3-2.9 2.1-2.9 1.8 0 1.8 1.7 1.8 3V20h3.3v-6.9z" />
      </svg>
    );
  }
  return <span className="text-[11px] font-[600] uppercase">{platform.slice(0, 2)}</span>;
}
