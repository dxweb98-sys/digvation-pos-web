import { Link } from 'react-router';

export function UnauthorizedPage() {
  return <section className="px-5 py-12 lg:px-8"><div className="max-w-lg rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6"><h1 className="text-xl font-bold">Access unavailable</h1><p className="mt-2 text-sm text-[var(--color-text-muted)]">Your current role does not grant access to this area.</p><Link className="mt-5 inline-flex text-sm font-semibold text-[var(--color-brand)]" to="/">Go to dashboard</Link></div></section>;
}
