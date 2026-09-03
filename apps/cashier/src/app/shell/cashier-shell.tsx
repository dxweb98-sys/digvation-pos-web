import { useAuth } from '@digvation/pos-auth';
import { useConnectivity, useRuntime } from '@digvation/pos-runtime';
import { Building2, CircleUserRound, LayoutGrid, ReceiptText, Rows3 } from 'lucide-react';
import { NavLink, Outlet } from 'react-router';

import { getAppVersion } from '../version/app-version';

const NAVIGATION = [
  { to: '/sell', label: 'Sell', icon: LayoutGrid },
  { to: '/open-sales', label: 'Open Sales', icon: Rows3 },
  { to: '/account', label: 'Account', icon: CircleUserRound },
] as const;

function formatCurrentDate(locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date());
}

export function CashierShell() {
  const runtime = useRuntime();
  const connectivity = useConnectivity();
  const { session } = useAuth();
  const version = getAppVersion();
  const brandSubtitle =
    runtime.branding.businessName ?? runtime.branding.companyName ?? runtime.workspace;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--color-background)] lg:grid lg:grid-cols-[256px_minmax(0,1fr)]">
      <aside className="shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface)] lg:flex lg:h-screen lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex h-16 items-center gap-3 border-b border-[var(--color-border)] px-5">
          <div className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-[var(--color-brand)]/10 text-[var(--color-brand)]">
            {runtime.branding.logoUrl ? (
              <img
                src={runtime.branding.logoUrl}
                alt={`${runtime.branding.productName} logo`}
                className="size-full object-contain p-1"
              />
            ) : (
              <ReceiptText className="size-5" strokeWidth={2.2} />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[var(--color-text)]">
              {runtime.branding.productName}
            </p>
            <p className="truncate text-xs text-[var(--color-text-muted)]">{brandSubtitle}</p>
          </div>
        </div>

        <div className="mx-3 mt-3 rounded-[var(--radius-control)] bg-[var(--color-surface-muted)] px-3 py-2.5">
          <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
            <Building2 className="size-4" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">Branch</span>
          </div>
          <p className="mt-1 text-xs font-medium text-[var(--color-text-muted)]">
            Branch selected in Sell
          </p>
        </div>

        <nav className="mt-3 flex gap-1 px-3 lg:flex-col">
          {NAVIGATION.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  'flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-150',
                  isActive
                    ? 'bg-[var(--color-brand)]/10 text-[var(--color-brand)]'
                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]',
                ].join(' ')
              }
            >
              <Icon className="size-4.5" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mx-5 mt-auto hidden border-t border-[var(--color-border)] py-3 text-xs text-[var(--color-text-muted)] lg:block">
          v{version.version} · {version.revision}
        </div>
      </aside>

      <main className="grid min-h-0 min-w-0 flex-1 grid-rows-[64px_minmax(0,1fr)] overflow-hidden">
        <header className="flex h-16 items-center justify-between gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${
                connectivity.state === 'OFFLINE'
                  ? 'bg-[var(--color-accent-coral)]/45'
                  : 'bg-[var(--color-accent-mint)]/55'
              }`}
            >
              <span className="size-1.5 rounded-full bg-current" /> {connectivity.state}
            </span>
            <span className="hidden text-xs text-[var(--color-text-muted)] sm:inline">
              {formatCurrentDate(runtime.locale)}
            </span>
          </div>
          <div className="min-w-0 text-right">
            <p className="truncate text-sm font-semibold">{session.identity.displayName}</p>
            <p className="text-xs text-[var(--color-text-muted)]">{runtime.deploymentProfile}</p>
          </div>
        </header>

        <div className="min-h-0 overflow-y-auto overscroll-contain">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
