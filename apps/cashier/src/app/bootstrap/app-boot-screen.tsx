import { ReceiptText } from 'lucide-react';

interface AppBootScreenProps {
  productName?: string;
  message?: string;
}

export function AppBootScreen({
  productName = 'Digvation POS',
  message = 'Preparing your workspace',
}: AppBootScreenProps) {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className="relative grid min-h-screen place-items-center overflow-hidden bg-[var(--color-background)] px-6 text-center"
    >
      <div className="pointer-events-none absolute left-[12%] top-[18%] size-64 rounded-full bg-[var(--color-brand)]/[0.035] blur-3xl" />
      <div className="pointer-events-none absolute bottom-[12%] right-[14%] size-56 rounded-full bg-[var(--color-accent-lavender)]/25 blur-3xl" />
      <section className="relative w-full max-w-sm">
        <div className="mx-auto grid size-14 place-items-center rounded-[var(--radius-card)] bg-[var(--color-brand)] text-white shadow-lg shadow-[var(--color-brand)]/20">
          <ReceiptText className="size-6" />
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-[-0.04em]">{productName}</h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">{message}</p>
        <div className="mx-auto mt-6 h-1 w-28 overflow-hidden rounded-full bg-[var(--color-border)]">
          <span className="block h-full w-1/2 animate-[boot-progress_1.1s_ease-in-out_infinite] rounded-full bg-[var(--color-brand)]" />
        </div>
      </section>
    </main>
  );
}
