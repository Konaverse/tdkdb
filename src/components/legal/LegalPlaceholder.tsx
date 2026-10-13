/** A legal page whose document is not yet published: a heading and where to
    write meanwhile. Noindexed by its page until the text exists. */
export default function LegalPlaceholder({ title, email }: { title: string; email?: string }) {
  return (
    <main style={{ background: '#ffffff', color: '#111111' }}>
      <section
        data-nav="light"
        className="px-page flex min-h-[72svh] flex-col justify-end pb-[18svh] pt-[24svh]"
        style={{ fontFamily: 'var(--font-josefin)' }}
      >
        <h1 className="text-[clamp(40px,6.4vw,96px)] font-[200] leading-[1] tracking-[-0.015em]">
          {title}
        </h1>
        <p className="mt-8 max-w-[52ch] text-[clamp(16px,1.2vw,20px)] font-[300] leading-[1.5]">
          This document is being prepared and will be published here.
          {email && (
            <>
              {' '}
              Until then, write to{' '}
              <a
                href={`mailto:${email}`}
                className="underline decoration-[#111111]/30 underline-offset-4 transition-colors duration-300 hover:text-threshold"
              >
                {email}
              </a>{' '}
              with any question about how TDK handles your details.
            </>
          )}
        </p>
      </section>
    </main>
  );
}
