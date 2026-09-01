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

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <header className="border-b border-[var(--color-border)] bg-white/90 px-5 backdrop-blur-xl lg:px-8">
        <div className="mx-auto flex min-h-18 max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-[#17191d] text-white">
              <Settings2 className="size-5" />
            </div>
            <div>
              <p className="text-sm font-bold">{runtime.branding.productName}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Backoffice</p>
            </div>
          </div>
          <FoundationBadge />
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl lg:grid-cols-[210px_minmax(0,1fr)]">
        <aside className="border-b border-[var(--color-border)] p-4 lg:min-h-[calc(100vh-72px)] lg:border-b-0 lg:border-r">
          <nav className="flex gap-2 lg:flex-col">
            {NAVIGATION.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  [
                    'flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors duration-200',
                    isActive
                      ? 'bg-[#17191d] text-white'
                      : 'text-[var(--color-text-muted)] hover:bg-white hover:text-[var(--color-text)]',
                  ].join(' ')
                }
              >
                <Icon className="size-4.5" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-6 hidden rounded-xl bg-white p-3 text-xs leading-5 text-[var(--color-text-muted)] lg:block">
            Signed in as{' '}
            <strong className="text-[var(--color-text)]">{session.identity.displayName}</strong>
          </div>
        </aside>
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
