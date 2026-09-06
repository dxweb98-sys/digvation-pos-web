import { useRuntime } from '@digvation/pos-runtime';
import { DAvatar, DBadge, DButton } from '@digvation/ui';
import {
  BookOpen,
  Building2,
  ChartNoAxesCombined,
  CircleUserRound,
  LayoutDashboard,
  LogOut,
  ReceiptText,
  Tags,
  UserRound,
  UsersRound,
  WalletCards,
  type LucideIcon,
} from 'lucide-react';
import { NavLink, Outlet } from 'react-router';

import { canAccessBackoffice, type BackofficeCapability } from '../../auth/backoffice-access';
import { useBackofficeAuth } from '../../auth/backoffice-auth-context';

interface NavigationItem {
  label: string;
  to: string;
  icon: LucideIcon;
  capability: BackofficeCapability;
}

const dashboardItem: NavigationItem = {
  label: 'Dashboard',
  to: '/',
  icon: LayoutDashboard,
  capability: 'dashboard',
};

const navigationSections: ReadonlyArray<{ label: string; items: readonly NavigationItem[] }> = [
  {
    label: 'Master Data',
    items: [
      { label: 'Catalog', to: '/catalog', icon: Tags, capability: 'catalog' },
      { label: 'Employees', to: '/employees', icon: UsersRound, capability: 'employees' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Financial Accounts', to: '/financial-accounts', icon: WalletCards, capability: 'finance' },
      { label: 'Expenses', to: '/expenses', icon: BookOpen, capability: 'finance' },
      { label: 'Reconciliation', to: '/reconciliation', icon: ChartNoAxesCombined, capability: 'finance' },
    ],
  },
  { label: 'Reports', items: [{ label: 'Reports', to: '/reports', icon: ChartNoAxesCombined, capability: 'reports' }] },
  {
    label: 'Configuration',
    items: [
      { label: 'Business', to: '/business', icon: Building2, capability: 'configuration' },
      { label: 'Access Control', to: '/access-control', icon: CircleUserRound, capability: 'accessControl' },
    ],
  },
];

export function BackofficeShell() {
  const runtime = useRuntime();
  const { session, logout } = useBackofficeAuth();
  if (!session) return null;

  const brandSubtitle =
    runtime.branding.businessName ?? runtime.branding.companyName ?? 'Backoffice';
  const roleContext = session.identity.roles.map((role) => role.name).join(', ') || 'Authenticated user';
  const currentDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-background)] lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="flex min-h-0 shrink-0 flex-col border-b border-[var(--color-border)] bg-[var(--color-surface)] lg:border-b-0 lg:border-r lg:shadow-[1px_0_0_var(--color-border)]">
        <div className="flex min-h-16 items-center gap-3 border-b border-[var(--color-border)] px-5 py-3">
          <div className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-control)] bg-[var(--color-brand)]/10 text-[var(--color-brand)]">
            {runtime.branding.logoUrl ? (
              <img src={runtime.branding.logoUrl} alt={`${runtime.branding.productName} logo`} className="size-full object-contain p-1" />
            ) : (
              <ReceiptText className="size-[18px]" strokeWidth={2.2} />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-5 text-[var(--color-text)]">{runtime.branding.productName}</p>
            <p className="truncate text-xs leading-4 text-[var(--color-text-muted)]">{brandSubtitle}</p>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-3 py-3 lg:flex-col lg:overflow-visible">
          <NavigationLink item={dashboardItem} />
          {navigationSections.map((section) => {
            const items = section.items.filter((item) => canAccessBackoffice(session, item.capability));
            if (!items.length) return null;
            return (
              <div key={section.label} className="min-w-max lg:mt-3">
                <p className="hidden px-2.5 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-text-muted)] lg:block">{section.label}</p>
                {items.map((item) => <NavigationLink key={item.label} item={item} />)}
              </div>
            );
          })}
        </nav>

        <div className="mt-auto hidden border-t border-[var(--color-border)] lg:block">
          <div className="px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <DAvatar alt="" name={session.identity.displayName} fallback={<UserRound className="size-4" aria-label="User account" />} size="sm" className="shrink-0 bg-[var(--color-brand)]/10 text-xs font-bold text-[var(--color-brand)]" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium leading-5 text-[var(--color-text)]">{session.identity.displayName}</span>
                <span className="block truncate text-xs leading-4 text-[var(--color-text-muted)]">{roleContext}</span>
              </span>
            </div>
          </div>
          <div className="border-t border-[var(--color-border)] px-3 py-2">
            <DButton variant="ghost" type="button" rightIcon={<LogOut className="size-4 shrink-0" />} onClick={() => void logout()} className="flex h-9 w-full items-center justify-start gap-2.5 px-3 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]">
              Logout
            </DButton>
          </div>
        </div>
      </aside>

      <main className="grid min-h-0 min-w-0 flex-1 grid-rows-[64px_minmax(0,1fr)] overflow-hidden">
        <header className="flex h-16 items-center justify-between gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 shadow-[0_1px_0_var(--color-border)] lg:px-8">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--color-text)]">Backoffice</p>
            <p className="truncate text-xs text-[var(--color-text-muted)]">{brandSubtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <p className="hidden text-xs text-[var(--color-text-muted)] md:block">{currentDate}</p>
            <span className="hidden h-5 w-px bg-[var(--color-border)] md:block" aria-hidden="true" />
            <DBadge variant="outline" className="hidden sm:inline-flex">{session.identity.workspace}</DBadge>
            <DButton variant="ghost" size="icon" className="lg:hidden" aria-label="Log out" onClick={() => void logout()}><LogOut className="size-[18px]" /></DButton>
          </div>
        </header>
        <div className="min-h-0 overflow-y-auto overscroll-contain"><Outlet /></div>
      </main>
    </div>
  );
}

function NavigationLink({ item }: { item: NavigationItem }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) => [
        'flex h-8 items-center justify-start gap-2 rounded-[var(--radius-control)] border border-transparent px-2.5 text-sm font-medium transition-colors duration-150',
        isActive ? 'border-[var(--color-brand)]/10 bg-[var(--color-brand)]/10 text-[var(--color-brand)]' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]',
      ].join(' ')}
    >
      <Icon className="size-[18px] shrink-0" />
      {item.label}
    </NavLink>
  );
}
