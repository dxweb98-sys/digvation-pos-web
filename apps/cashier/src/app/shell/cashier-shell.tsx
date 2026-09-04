import { useAuth } from '@digvation/pos-auth';
import { useConnectivity, useRuntime } from '@digvation/pos-runtime';
import { Button, Dialog, Dropdown, useToast } from '@digvation/pos-ui';
import { useQuery } from '@tanstack/react-query';
import {
  Check,
  ChevronDown,
  CircleUserRound,
  LayoutGrid,
  LogOut,
  MapPin,
  ReceiptText,
  Rows3,
  UserRound,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router';

import { cashierTransactionKeys } from '../../features/sell/cashier-transaction-keys';
import { createCashierTransactionAdapter } from '../../features/sell/cashier-transaction-client';
import { useCashierSession } from '../providers/cashier-session-provider';
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

function identityInitials(displayName: string, initials?: string): string | null {
  if (initials?.trim()) return initials.trim().slice(0, 2).toUpperCase();
  const derived = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase();
  return derived || null;
}

export function CashierShell() {
  const runtime = useRuntime();
  const connectivity = useConnectivity();
  const { session, logout } = useAuth();
  const { showToast } = useToast();
  const [isLoggingOut, setLoggingOut] = useState(false);
  const {
    selectedLocationId,
    selectLocation,
    isBranchPickerOpen,
    openBranchPicker,
    closeBranchPicker,
  } = useCashierSession();
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const version = getAppVersion();
  const transactionAdapter = useMemo(
    () => createCashierTransactionAdapter(runtime.apiBaseUrl),
    [runtime.apiBaseUrl],
  );
  const locationsQuery = useQuery({
    queryKey: cashierTransactionKeys.locations(),
    queryFn: ({ signal }) => transactionAdapter.listSellingLocations(signal),
  });
  const locations = useMemo(
    () => (locationsQuery.data?.items ?? []).filter((location) => location.status === 'ACTIVE'),
    [locationsQuery.data],
  );
  const selectedLocation = locations.find((location) => location.id === selectedLocationId) ?? null;
  const brandSubtitle =
    runtime.branding.businessName ?? runtime.branding.companyName ?? runtime.workspace;
  const userInitials = identityInitials(session.identity.displayName, session.identity.initials);

  useEffect(() => {
    if (!selectedLocationId && locations.length > 0) {
      selectLocation(locations[0]!.id);
    }
  }, [locations, selectLocation, selectedLocationId]);

  const handleLocationSelect = (locationId: string) => {
    if (locationId === selectedLocationId) {
      closeBranchPicker();
      return;
    }

    if (/^\/sell\/[^/]+$/.test(routerLocation.pathname)) {
      const confirmed = window.confirm(
        'Changing Branch leaves the current Sale OPEN and returns you to a new Sale. Continue?',
      );
      if (!confirmed) return;
      navigate('/sell');
    }

    selectLocation(locationId);
    closeBranchPicker();
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      setLoggingOut(false);
      showToast({
        title: 'Logout gagal',
        description: 'Sesi belum dapat diakhiri. Silakan coba lagi.',
        variant: 'danger',
      });
    }
  };

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

        <div className="px-3 pt-3">
          <button
            type="button"
            onClick={openBranchPicker}
            aria-haspopup="dialog"
            aria-expanded={isBranchPickerOpen}
            className="flex w-full items-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2.5 text-left transition-colors hover:bg-[var(--color-background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
          >
            <MapPin className="size-4 shrink-0 text-[var(--color-brand)]" />
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                Active branch
              </span>
              <span className="mt-0.5 block truncate text-sm font-semibold">
                {selectedLocation?.name ??
                  (locationsQuery.isLoading ? 'Loading branch' : 'Choose branch')}
              </span>
            </span>
            <ChevronDown className="size-4 shrink-0 text-[var(--color-text-muted)]" />
          </button>
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
          <Dropdown
            placement="bottom-end"
            contentRole="menu"
            closeOnItemClick
            trigger={({ open }) => (
              <button
                type="button"
                disabled={isLoggingOut}
                aria-label="Open account menu"
                aria-haspopup="menu"
                aria-expanded={open}
                className="flex min-w-0 items-center gap-3 rounded-[var(--radius-control)] py-1 pl-2 pr-1.5 text-right transition-colors hover:bg-[var(--color-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="hidden min-w-0 sm:block">
                  <span className="block truncate text-sm font-semibold">
                    {session.identity.displayName}
                  </span>
                  <span className="block truncate text-xs text-[var(--color-text-muted)]">
                    {session.identity.email ?? runtime.deploymentProfile}
                  </span>
                </span>
                <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--color-brand)]/10 text-xs font-bold text-[var(--color-brand)] ring-1 ring-[var(--color-brand)]/15">
                  {session.identity.avatarUrl ? (
                    <img
                      src={session.identity.avatarUrl}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    (userInitials ?? <UserRound className="size-4" aria-label="User account" />)
                  )}
                </span>
                <ChevronDown
                  className={`hidden size-3.5 shrink-0 text-[var(--color-text-muted)] transition-transform sm:block ${
                    open ? 'rotate-180' : ''
                  }`}
                />
              </button>
            )}
          >
            <div className="min-w-[240px]">
              <div className="border-b border-[var(--color-border)] px-3 py-3">
                <p className="truncate text-sm font-semibold text-[var(--color-text)]">
                  {session.identity.displayName}
                </p>
                <p className="mt-0.5 truncate text-xs text-[var(--color-text-muted)]">
                  {session.identity.email ?? session.identity.userId}
                </p>
              </div>
              <div className="p-1">
                <button
                  type="button"
                  role="menuitem"
                  disabled={isLoggingOut}
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger)]/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <LogOut className="size-4" />
                  {isLoggingOut ? 'Mengakhiri sesi...' : 'Logout'}
                </button>
              </div>
            </div>
          </Dropdown>
        </header>

        <div className="min-h-0 overflow-y-auto overscroll-contain">
          <Outlet />
        </div>
      </main>

      <Dialog
        open={isBranchPickerOpen}
        onClose={closeBranchPicker}
        ariaLabel="Choose active branch"
        closeOnEscape
        closeOnOverlay
        showClose={false}
        noPadding
        className="w-full max-w-md rounded-t-[var(--radius-panel)] bg-[var(--color-surface)] shadow-2xl sm:rounded-[var(--radius-panel)]"
      >
        <div className="border-b border-[var(--color-border)] px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-brand)]">
            Workspace
          </p>
          <h2 className="mt-1 text-lg font-bold">Choose active branch</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Sales and catalog pricing use this branch context.
          </p>
        </div>
        <div className="max-h-[min(420px,60vh)] overflow-y-auto p-3">
          {locationsQuery.isLoading ? (
            <p className="p-3 text-sm text-[var(--color-text-muted)]">Loading branches…</p>
          ) : locations.length === 0 ? (
            <div className="p-3 text-sm text-[var(--color-text-muted)]">
              No active branches are available for this workspace.
            </div>
          ) : (
            <div className="space-y-1">
              {locations.map((location) => {
                const isSelected = location.id === selectedLocationId;
                return (
                  <button
                    key={location.id}
                    type="button"
                    onClick={() => handleLocationSelect(location.id)}
                    className={`flex w-full items-center justify-between gap-3 rounded-[var(--radius-control)] px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] ${
                      isSelected
                        ? 'bg-[var(--color-brand)]/10 text-[var(--color-brand)]'
                        : 'hover:bg-[var(--color-surface-muted)]'
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{location.name}</span>
                      <span className="mt-0.5 block font-mono text-[10px] text-[var(--color-text-muted)]">
                        {location.code}
                      </span>
                    </span>
                    {isSelected ? <Check className="size-4 shrink-0" /> : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="border-t border-[var(--color-border)] p-3">
          <Button variant="secondary" className="w-full" onClick={closeBranchPicker}>
            Close
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
