import { useAuth } from '@digvation/pos-auth';
import { useRuntime } from '@digvation/pos-runtime';
import { FoundationBadge } from '@digvation/pos-ui';
import { CircleUserRound, LayoutGrid, ReceiptText, Store } from 'lucide-react';
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

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="border-b border-[var(--color-border)] bg-[#17191d] px-4 py-4 text-white lg:min-h-screen lg:border-b-0">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="grid size-10 place-items-center rounded-xl bg-white text-[#17191d] shadow-sm">
            <ReceiptText className="size-5" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{runtime.branding.productName}</p>
            <p className="truncate text-xs text-white/55">
              {runtime.branding.businessName ?? runtime.workspace}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.06] p-3">
          <div className="flex items-center gap-2 text-white/55">
            <Store className="size-4" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">
              Selling location
            </span>
          </div>
          <p className="mt-2 text-sm font-semibold">Not selected yet</p>
          <p className="mt-1 text-xs leading-5 text-white/50">
            Location selection starts with Cashier Transaction Foundation.
          </p>
        </div>

        <nav className="mt-5 flex gap-2 lg:flex-col">
          {NAVIGATION.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  'flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors duration-200',
                  isActive
                    ? 'bg-white text-[#17191d]'
                    : 'text-white/65 hover:bg-white/10 hover:text-white',
                ].join(' ')
              }
            >
              <Icon className="size-4.5" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-6 hidden text-xs text-white/35 lg:block">
          v{version.version} · {version.revision}
        </div>
      </aside>

      <main className="min-w-0">
        <header className="flex min-h-18 items-center justify-between gap-4 border-b border-[var(--color-border)] bg-white/80 px-5 backdrop-blur-xl lg:px-8">
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
        <Outlet />
      </main>
    </div>
  );
}
