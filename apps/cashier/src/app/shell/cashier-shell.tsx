import { useAuth } from '@digvation/pos-auth';
import { useRuntime } from '@digvation/pos-runtime';
import { FoundationBadge } from '@digvation/pos-ui';
import { Building2, CircleUserRound, LayoutGrid, ReceiptText } from 'lucide-react';
import { NavLink, Outlet } from 'react-router';

import { getAppVersion } from '../version/app-version';

const NAVIGATION = [
  { to: '/sell', label: 'Sell', icon: LayoutGrid },
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
  const { session } = useAuth();
  const version = getAppVersion();
  const brandSubtitle =
    runtime.branding.businessName ?? runtime.branding.companyName ?? runtime.workspace;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--color-background)] lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4 lg:h-screen lg:border-b-0 lg:border-r">
        <div
          className="mb-4 h-1 w-full rounded-full"
          style={{ background: 'var(--gradient-brand-spectrum)' }}
          aria-hidden="true"
        />

        <div className="flex items-center gap-3 px-2 py-2">
          <div
            className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-control)] text-[var(--color-text)] shadow-sm"
            style={{ background: 'var(--gradient-brand-spectrum)' }}
          >
            {runtime.branding.logoUrl ? (
              <img
                src={runtime.branding.logoUrl}
                alt={`${runtime.branding.productName} logo`}
                className="size-full object-contain p-1.5"
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

        <div className="mt-5 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3">
          <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
            <Building2 className="size-4" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">Branch</span>
          </div>
          <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">Not selected yet</p>
          <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
            Branch selection is connected with the transaction workspace, without inventing local
            branch data.
          </p>
        </div>

        <nav className="mt-5 flex gap-2 lg:flex-col">
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

        <div className="mt-6 hidden text-xs text-[var(--color-text-muted)] lg:block">
          v{version.version} · {version.revision}
        </div>
      </aside>

      <main className="grid min-h-0 min-w-0 flex-1 grid-rows-[72px_minmax(0,1fr)] overflow-hidden">
        <header className="flex min-h-18 items-center justify-between gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <FoundationBadge />
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
