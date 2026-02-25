export default function HomePage() {
  return (
    <main className="mx-auto max-w-content px-8 py-section">
      <section className="mb-20 space-y-4 border-b border-border pb-20">
        <p className="text-label text-stone">Typography Scale — Phase 2.3 Verification</p>
        <h1 className="text-display-xl">Display XL</h1>
        <h2 className="text-display-lg">Display LG</h2>
        <h3 className="text-display-md">Display MD</h3>
        <h4 className="text-heading">Heading</h4>
        <p className="text-body-lg">
          Body Large — The balconies are not additions. They are extensions of the living floor.
          Select this text to verify selection color.
        </p>
        <p className="text-body">
          Body — Every detail in the design serves a purpose. Nothing is arbitrary, nothing is
          accidental. This is architecture with intention.
        </p>
        <p className="text-label text-stone">Label — Uppercase Tracked</p>
        <p className="text-mono text-stone">text-mono — 13px JetBrains Mono 400</p>
      </section>

      <section className="space-y-4">
        <p className="text-label text-stone">Color Tokens</p>
        <div className="flex gap-4">
          <div className="flex h-20 w-20 items-center justify-center bg-void text-label text-paper">
            void
          </div>
          <div className="flex h-20 w-20 items-center justify-center bg-surface text-label text-paper">
            surface
          </div>
          <div className="flex h-20 w-20 items-center justify-center bg-paper text-label text-void">
            paper
          </div>
          <div className="flex h-20 w-20 items-center justify-center bg-stone text-label text-void">
            stone
          </div>
          <div className="flex h-20 w-20 items-center justify-center bg-threshold text-label text-void">
            threshold
          </div>
        </div>
      </section>
    </main>
  );
}
