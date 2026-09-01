import { Button } from '@digvation/pos-ui';
import { ArrowRight, Layers3, ShieldCheck, Sparkles } from 'lucide-react';

const FOUNDATION_POINTS = [
  {
    icon: Layers3,
    title: 'Domain boundaries first',
    description:
      'Cashier workflow will consume backend facts through query and command boundaries.',
  },
  {
    icon: ShieldCheck,
    title: 'Auth adapter ready',
    description: 'Mock authentication is isolated and can be replaced when AUTH-01 is approved.',
  },
  {
    icon: Sparkles,
    title: 'White-label runtime',
    description: 'Branding and deployment topology are runtime configuration, not source forks.',
  },
] as const;

export function SellFoundationPage() {
  return (
    <section className="px-5 py-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-panel)]">
          <div className="grid min-h-[420px] lg:grid-cols-[1.1fr_0.9fr]">
            <div className="flex flex-col justify-between p-7 lg:p-10">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-brand)]">
                  Cashier
                </p>
                <h1 className="mt-4 max-w-xl text-3xl font-bold tracking-[-0.04em] text-balance lg:text-5xl">
                  Foundation ready for the transaction experience.
                </h1>
                <p className="mt-5 max-w-xl text-sm leading-7 text-[var(--color-text-muted)] lg:text-base">
                  This screen intentionally contains no fake cart or transaction data. The next
                  approved checkpoint will connect real selling catalog and Sale behavior.
                </p>
              </div>

              <div className="mt-8">
                <Button disabled>
                  Transaction foundation not started
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </div>
            </div>

            <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-muted)] p-5 lg:border-l lg:border-t-0 lg:p-7">
              <div className="grid h-full gap-3">
                {FOUNDATION_POINTS.map(({ icon: Icon, title, description }) => (
                  <article
                    key={title}
                    className="rounded-2xl border border-white bg-white/80 p-5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5"
                  >
                    <div className="grid size-9 place-items-center rounded-xl bg-[var(--color-surface-muted)]">
                      <Icon className="size-4.5 text-[var(--color-brand)]" />
                    </div>
                    <h2 className="mt-4 text-sm font-bold">{title}</h2>
                    <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                      {description}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
