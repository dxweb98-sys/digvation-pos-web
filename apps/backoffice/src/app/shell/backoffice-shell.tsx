import { useAuth } from '@digvation/pos-auth';
import { useRuntime } from '@digvation/pos-runtime';
import { FoundationBadge } from '@digvation/pos-ui';
import { CircleUserRound, LayoutDashboard, Settings2 } from 'lucide-react';
import { NavLink, Outlet } from 'react-router';

const NAVIGATION = [
  { to: '/operations', label: 'Operations', icon: LayoutDashboard },
  { to: '/account', label: 'Account', icon: CircleUserRound },
] as const;

export function BackofficeShell() {
  const runtime = useRuntime();
  const { session } = useAuth();
  const brandSubtitle =
    runtime.branding.businessName ?? runtime.branding.companyName ?? 'Backoffice';

  return (
    <div className="grid h-screen grid-rows-[72px_minmax(0,1fr)] overflow-hidden bg-[var(--color-background)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 lg:px-8">
        <div className="flex min-h-18 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-control)] bg-[var(--color-accent-lavender)] text-[var(--color-text)]">
              {runtime.branding.logoUrl ? (
                <img
                  src={runtime.branding.logoUrl}
                  alt={`${runtime.branding.productName} logo`}
                  className="size-full object-contain p-1.5"
                />
              ) : (
                <Settings2 className="size-5" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{runtime.branding.productName}</p>
              <p className="truncate text-xs text-[var(--color-text-muted)]">{brandSubtitle}</p>
            </div>
          </div>
          <FoundationBadge />
        </div>
      </header>

      <div className="flex min-h-0 flex-col lg:grid lg:grid-cols-[210px_minmax(0,1fr)]">
        <aside className="shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface)] p-4 lg:border-b-0 lg:border-r">
          <nav className="flex gap-2 lg:flex-col">
            {NAVIGATION.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  [
                    'flex min-h-11 items-center gap-3 rounded-[var(--radius-control)] px-3 text-sm font-semibold transition-colors duration-200',
                    isActive
                      ? 'bg-[var(--color-surface-muted)] text-[var(--color-text)]'
                      : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]',
                  ].join(' ')
                }
              >
                <Icon className="size-4.5" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-6 hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3 text-xs leading-5 text-[var(--color-text-muted)] lg:block">
            Signed in as{' '}
            <strong className="text-[var(--color-text)]">{session.identity.displayName}</strong>
          </div>
        </aside>

        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
