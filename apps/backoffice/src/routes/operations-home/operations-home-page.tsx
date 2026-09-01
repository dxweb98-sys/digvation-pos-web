import { Boxes, Building2, Tags } from 'lucide-react';

const UPCOMING = [
  ['Branches', Building2, 'Branch configuration maps to the backend Selling Location contract.'],
  ['Catalog', Boxes, 'Items, categories and variants will use approved backend contracts.'],
  ['Pricing & Tax', Tags, 'Financial configuration remains backend authoritative.'],
] as const;

export function OperationsHomePage() {
  return (
    <section className="px-5 py-6 lg:px-8 lg:py-8">
      <div className="max-w-5xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-brand)]">
          Operations
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-[-0.04em]">Backoffice foundation</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--color-text-muted)]">
          No fake dashboard metrics are shown. Management capabilities appear only when their
          backend contract and frontend checkpoint are approved.
        </p>

        <div className="mt-7 grid gap-3 md:grid-cols-3">
          {UPCOMING.map(([title, Icon, description], index) => {
            const accents = [
              'var(--color-accent-yellow)',
              'var(--color-accent-sky)',
              'var(--color-accent-coral)',
            ] as const;

            return (
              <article
                key={title}
                className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm"
              >
                <div
                  className="grid size-9 place-items-center rounded-[var(--radius-control)]"
                  style={{ backgroundColor: accents[index] }}
                >
                  <Icon className="size-4.5 text-[var(--color-text)]" />
                </div>
                <h2 className="mt-4 text-sm font-bold">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                  {description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
