export function PlaceholderPage({ title }: { title: string }) {
  return (
    <section className="px-5 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="max-w-5xl">
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-[var(--color-text)]">{title}</h1>
        <div className="mt-5 max-w-2xl rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4">
          <p className="text-sm leading-6 text-[var(--color-text-muted)]">This area will be available when its dedicated Backoffice capability is delivered.</p>
        </div>
      </div>
    </section>
  );
}
