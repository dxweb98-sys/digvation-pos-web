export function FoundationBadge() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs font-semibold text-[var(--color-text-muted)]">
      <span className="size-1.5 rounded-full bg-[var(--color-success)]" aria-hidden="true" />
      Frontend Foundation
    </span>
  );
}
