import { ApiClient } from '@digvation/pos-api';
import { formatMoney } from '@digvation/pos-money';
import { useRuntime } from '@digvation/pos-runtime';
import { Button } from '@digvation/pos-ui';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft, Clock3, LoaderCircle, ReceiptText, RefreshCw } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router';

import { useCashierSession } from '../../app/providers/cashier-session-provider';
import { HttpCashierTransactionAdapter } from '../../features/sell/cashier-transaction.adapter';
import { cashierTransactionKeys } from '../../features/sell/cashier-transaction.keys';
import type { OpenSaleSummaryViewModel } from '../../features/sell/cashier-transaction.types';

export function OpenSalesPage() {
  const runtime = useRuntime();
  const navigate = useNavigate();
  const { selectedLocationId, recentSaleIds, selectLocation, rememberSale } = useCashierSession();
  const transactionAdapter = useMemo(
    () => new HttpCashierTransactionAdapter(new ApiClient({ baseUrl: runtime.apiBaseUrl })),
    [runtime.apiBaseUrl],
  );

  const locationsQuery = useQuery({
    queryKey: cashierTransactionKeys.locations(),
    queryFn: ({ signal }) => transactionAdapter.listSellingLocations(signal),
  });
  const salesQuery = useQuery({
    queryKey: cashierTransactionKeys.sales(),
    queryFn: ({ signal }) => transactionAdapter.listSales(signal),
  });

  const locationNames = new Map(
    (locationsQuery.data?.items ?? []).map((location) => [location.id, location.name]),
  );
  const openSales = (salesQuery.data?.items ?? [])
    .filter((sale) => sale.status === 'OPEN')
    .filter((sale) => !selectedLocationId || sale.sellingLocationId === selectedLocationId)
    .map<OpenSaleSummaryViewModel>((sale) => ({
      id: sale.id,
      sellingLocationId: sale.sellingLocationId,
      locationName: locationNames.get(sale.sellingLocationId) ?? 'Branch',
      totalAmount: sale.totalAmount,
      currency: sale.currency,
      activeLineCount: sale.lines.filter((line) => line.removedAt === null).length,
      updatedAt: sale.updatedAt,
    }))
    .sort((left, right) => {
      const leftRecent = recentSaleIds.indexOf(left.id);
      const rightRecent = recentSaleIds.indexOf(right.id);
      if (leftRecent >= 0 || rightRecent >= 0) {
        if (leftRecent < 0) return 1;
        if (rightRecent < 0) return -1;
        return leftRecent - rightRecent;
      }
      return right.updatedAt.localeCompare(left.updatedAt);
    });

  const resumeSale = (sale: OpenSaleSummaryViewModel) => {
    selectLocation(sale.sellingLocationId);
    rememberSale(sale.id);
    navigate(`/sell/${sale.id}`);
  };

  return (
    <section className="px-5 py-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-brand)]">
              Cashier
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em]">Open Sales</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
              Resume an OPEN Sale without changing backend state. This is navigation, not a hold or
              park command.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => salesQuery.refetch()} disabled={salesQuery.isFetching}>
              <RefreshCw className={`mr-2 size-4 ${salesQuery.isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="secondary" onClick={() => navigate('/sell')}>
              <ArrowLeft className="mr-2 size-4" /> Sell
            </Button>
          </div>
        </div>

        {salesQuery.error ? (
          <div className="mt-6 flex gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-bold">Unable to load Open Sales</p>
              <p className="mt-1 text-[var(--color-text-muted)]">
                {salesQuery.error instanceof Error ? salesQuery.error.message : 'Unexpected error.'}
              </p>
            </div>
          </div>
        ) : null}

        <div className="mt-6">
          {salesQuery.isLoading ? (
            <div className="flex min-h-52 items-center justify-center rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-muted)]">
              <LoaderCircle className="mr-2 size-4 animate-spin" /> Loading open Sales…
            </div>
          ) : openSales.length === 0 ? (
            <div className="rounded-[var(--radius-panel)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-10 text-center">
              <ReceiptText className="mx-auto size-6 text-[var(--color-text-muted)]" />
              <p className="mt-4 text-sm font-bold">No OPEN Sales in this Branch view</p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                Starting a transaction still happens from Sell by choosing the first item.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {openSales.map((sale) => (
                <button
                  key={sale.id}
                  type="button"
                  onClick={() => resumeSale(sale)}
                  className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-left transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                        {sale.locationName}
                      </p>
                      <h2 className="mt-2 text-base font-bold">Sale {sale.id.slice(0, 8)}</h2>
                    </div>
                    <p className="text-sm font-bold tabular-nums">
                      {formatMoney(sale.totalAmount, sale.currency, runtime.locale)}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                    <span>{sale.activeLineCount} active lines</span>
                    <span className="flex items-center gap-1">
                      <Clock3 className="size-3.5" /> Updated{' '}
                      {new Intl.DateTimeFormat(runtime.locale, {
                        hour: '2-digit',
                        minute: '2-digit',
                      }).format(new Date(sale.updatedAt))}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
