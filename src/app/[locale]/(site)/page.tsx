import Button from '@/components/ui/Button';

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

      <section className="mb-20 space-y-8 border-b border-border pb-20">
        <p className="text-label text-stone">Button Component — Phase 3.3 Verification</p>

        <div className="space-y-2">
          <p className="text-label text-stone">Primary (md / lg / sm)</p>
          <div className="flex flex-wrap items-center gap-6">
            <Button variant="primary" size="md">View Projects</Button>
            <Button variant="primary" size="lg">Get Started</Button>
            <Button variant="primary" size="sm">Learn More</Button>
            <Button variant="primary" disabled>Disabled</Button>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-label text-stone">Ghost (md / lg / sm)</p>
          <div className="flex flex-wrap items-center gap-6">
            <Button variant="ghost" size="md">View Projects</Button>
            <Button variant="ghost" size="lg">Get Started</Button>
            <Button variant="ghost" size="sm">Learn More</Button>
            <Button variant="ghost" disabled>Disabled</Button>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-label text-stone">Text / link-style</p>
          <div className="flex flex-wrap items-center gap-8">
            <Button variant="text">Explore all projects</Button>
            <Button variant="text" href="/en/about">About us</Button>
            <Button variant="text" disabled>Disabled</Button>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-label text-stone">As anchor (href)</p>
          <div className="flex flex-wrap items-center gap-6">
            <Button variant="primary" href="/en/projects">Go to Projects</Button>
            <Button variant="ghost" href="/en/contact">Contact</Button>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-label text-stone">Magnetic (hover slowly over these)</p>
          <div className="flex flex-wrap items-center gap-6">
            <Button variant="primary" magnetic>Magnetic Primary</Button>
            <Button variant="ghost" magnetic>Magnetic Ghost</Button>
          </div>
        </div>
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
