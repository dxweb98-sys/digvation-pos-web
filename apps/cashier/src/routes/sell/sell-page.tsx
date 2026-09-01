import { ApiClient } from '@digvation/pos-api';
import { formatMoney } from '@digvation/pos-money';
import { useRuntime } from '@digvation/pos-runtime';
import { Button } from '@digvation/pos-ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Check, LoaderCircle, MapPin, Plus, ShoppingBag } from 'lucide-react';
import { useMemo, useState } from 'react';

import { HttpCashierTransactionAdapter } from './cashier-transaction.adapter';
import type { CatalogItem, Sale, SellingLocation } from './cashier-transaction.types';

const QUANTITY_PATTERN = /^(0|[1-9]\d{0,14})(\.\d{1,4})?$/;

function createIdempotencyKey(operation: string): string {
  return `cashier-${operation}-${crypto.randomUUID()}`;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unexpected transaction error.';
}

function getActiveLocations(locations: SellingLocation[]): SellingLocation[] {
  return locations.filter((location) => location.status === 'ACTIVE');
}

function getActiveItems(items: CatalogItem[]): CatalogItem[] {
  return items.filter((item) => item.lifecycle === 'ACTIVE');
}

function SaleSummary({ sale, locale }: { sale: Sale; locale: string }) {
  const activeLines = sale.lines.filter((line) => line.removedAt === null);

  return (
    <section className="rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-panel)] lg:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-brand)]">
            Active sale
          </p>
          <h2 className="mt-2 text-xl font-bold tracking-[-0.02em]">Current transaction</h2>
        </div>
        <span className="rounded-full bg-[var(--color-accent-mint)] px-3 py-1 text-xs font-bold">
          {sale.status}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {activeLines.length === 0 ? (
          <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] p-5 text-center">
            <ShoppingBag className="mx-auto size-5 text-[var(--color-text-muted)]" />
            <p className="mt-3 text-sm font-semibold">No items yet</p>
            <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
              Add an active catalog item. Price and totals are captured by the POS backend.
            </p>
          </div>
        ) : (
          activeLines.map((line) => (
            <article
              key={line.id}
              className="rounded-[var(--radius-card)] border border-[var(--color-border)] p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{line.itemNameSnapshot}</p>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    {line.itemCodeSnapshot} · Qty {line.quantity}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-bold">
                  {formatMoney(line.totalAmount, line.currency, locale)}
                </p>
              </div>
              <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                Unit {formatMoney(line.effectiveUnitPrice, line.currency, locale)}
              </p>
            </article>
          ))
        )}
      </div>

      <dl className="mt-5 space-y-2 border-t border-[var(--color-border)] pt-4 text-sm">
        <div className="flex justify-between gap-4 text-[var(--color-text-muted)]">
          <dt>Gross</dt>
          <dd>{formatMoney(sale.grossAmount, sale.currency, locale)}</dd>
        </div>
        <div className="flex justify-between gap-4 text-[var(--color-text-muted)]">
          <dt>Tax</dt>
          <dd>{formatMoney(sale.taxAmount, sale.currency, locale)}</dd>
        </div>
        <div className="flex justify-between gap-4 pt-2 text-base font-bold">
          <dt>Total</dt>
          <dd>{formatMoney(sale.totalAmount, sale.currency, locale)}</dd>
        </div>
      </dl>
    </section>
  );
}

export function SellPage() {
  const runtime = useRuntime();
  const queryClient = useQueryClient();
  const transactionPort = useMemo(
    () => new HttpCashierTransactionAdapter(new ApiClient({ baseUrl: runtime.apiBaseUrl })),
    [runtime.apiBaseUrl],
  );
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [activeSaleId, setActiveSaleId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState('');

  const locationsQuery = useQuery({
    queryKey: ['cashier', 'selling-locations'],
    queryFn: ({ signal }) => transactionPort.listSellingLocations(signal),
  });
  const catalogQuery = useQuery({
    queryKey: ['cashier', 'catalog-items'],
    queryFn: ({ signal }) => transactionPort.listCatalogItems(signal),
  });
  const saleQuery = useQuery({
    queryKey: ['cashier', 'sale', activeSaleId],
    queryFn: ({ signal }) => transactionPort.getSale(activeSaleId!, signal),
    enabled: activeSaleId !== null,
  });

  const locations = getActiveLocations(locationsQuery.data?.items ?? []);
  const catalogItems = getActiveItems(catalogQuery.data?.items ?? []);
  const effectiveLocationId =
    selectedLocationId || (locations.length === 1 ? locations[0]!.id : '');

  const createSaleMutation = useMutation({
    mutationFn: () =>
      transactionPort.createSale(
        { sellingLocationId: effectiveLocationId, currency: runtime.currency },
        createIdempotencyKey('create-sale'),
      ),
    onSuccess: (sale) => {
      queryClient.setQueryData(['cashier', 'sale', sale.id], sale);
      setActiveSaleId(sale.id);
    },
  });

  const addLineMutation = useMutation({
    mutationFn: (catalogItemId: string) => {
      const sale = saleQuery.data;
      if (!sale) throw new Error('Create a sale before adding an item.');
      if (!QUANTITY_PATTERN.test(quantity)) {
        throw new Error('Quantity must be a valid decimal value.');
      }

      return transactionPort.addSaleLine(
        sale.id,
        {
          expectedVersion: sale.version,
          catalogItemId,
          quantity,
        },
        createIdempotencyKey('add-line'),
      );
    },
    onSuccess: (sale) => {
      queryClient.setQueryData(['cashier', 'sale', sale.id], sale);
    },
  });

  const handleLocationChange = (nextLocationId: string) => {
    if (activeSaleId && nextLocationId !== effectiveLocationId) {
      const shouldSwitch = window.confirm(
        'Changing Branch will leave the current Sale open and clear it from this workspace. Continue?',
      );
      if (!shouldSwitch) return;
      setActiveSaleId(null);
    }
    setSelectedLocationId(nextLocationId);
  };

  const requestError =
    createSaleMutation.error ??
    addLineMutation.error ??
    saleQuery.error ??
    locationsQuery.error ??
    catalogQuery.error;
  const isLoading = locationsQuery.isLoading || catalogQuery.isLoading;
  const canCreateSale =
    effectiveLocationId !== '' && activeSaleId === null && !createSaleMutation.isPending;
  const canAddLine =
    Boolean(saleQuery.data) && QUANTITY_PATTERN.test(quantity) && !addLineMutation.isPending;

  return (
    <section className="px-5 py-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-brand)]">
              Cashier · Transaction foundation
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] lg:text-4xl">Sell</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
              Start an OPEN Sale and add catalog items. Transaction state, captured price, tax, and
              totals remain authoritative on the POS backend.
            </p>
          </div>

          <div className="w-full max-w-sm">
            <label
              htmlFor="branch"
              className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-text-muted)]"
            >
              Branch
            </label>
            <div className="relative mt-2">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <select
                id="branch"
                value={effectiveLocationId}
                onChange={(event) => handleLocationChange(event.target.value)}
                disabled={locationsQuery.isLoading || locations.length === 0}
                className="min-h-11 w-full appearance-none rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] pl-10 pr-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
              >
                <option value="">Select Branch</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {requestError ? (
          <div className="mb-5 flex gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 text-sm">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-bold">Unable to complete the transaction request</p>
              <p className="mt-1 text-[var(--color-text-muted)]">{getErrorMessage(requestError)}</p>
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
          <section className="rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-panel)] lg:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                  Catalog
                </p>
                <h2 className="mt-2 text-xl font-bold tracking-[-0.02em]">Available items</h2>
              </div>
              <div className="flex items-end gap-3">
                <label className="block">
                  <span className="text-xs font-semibold text-[var(--color-text-muted)]">
                    Quantity
                  </span>
                  <input
                    aria-label="Quantity"
                    inputMode="decimal"
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                    className="mt-1 block min-h-11 w-24 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
                  />
                </label>
                <Button
                  disabled={!canCreateSale}
                  onClick={() => createSaleMutation.mutate()}
                  className="whitespace-nowrap"
                >
                  {createSaleMutation.isPending ? (
                    <LoaderCircle className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 size-4" />
                  )}
                  New sale
                </Button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {isLoading ? (
                <div className="col-span-full flex min-h-40 items-center justify-center text-sm text-[var(--color-text-muted)]">
                  <LoaderCircle className="mr-2 size-4 animate-spin" /> Loading transaction data…
                </div>
              ) : catalogItems.length === 0 ? (
                <div className="col-span-full rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] p-6 text-center">
                  <p className="text-sm font-bold">No active catalog items</p>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    The Cashier does not invent local catalog data.
                  </p>
                </div>
              ) : (
                catalogItems.map((item) => (
                  <article
                    key={item.id}
                    className="flex min-h-40 flex-col rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full bg-[var(--color-accent-sky)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em]">
                        {item.type}
                      </span>
                      {saleQuery.data ? (
                        <Check className="size-4 text-[var(--color-text-muted)]" />
                      ) : null}
                    </div>
                    <h3 className="mt-4 text-sm font-bold">{item.name}</h3>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">{item.code}</p>
                    <Button
                      variant="secondary"
                      className="mt-auto w-full"
                      disabled={!canAddLine}
                      onClick={() => addLineMutation.mutate(item.id)}
                    >
                      {addLineMutation.isPending ? (
                        <LoaderCircle className="mr-2 size-4 animate-spin" />
                      ) : (
                        <Plus className="mr-2 size-4" />
                      )}
                      Add item
                    </Button>
                  </article>
                ))
              )}
            </div>
          </section>

          {saleQuery.data ? (
            <SaleSummary sale={saleQuery.data} locale={runtime.locale} />
          ) : (
            <section className="rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-panel)]">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                Active sale
              </p>
              <h2 className="mt-2 text-xl font-bold">No Sale selected</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
                Select a Branch and create a new Sale. Existing Sale recovery/list selection is not
                introduced by this checkpoint.
              </p>
            </section>
          )}
        </div>
      </div>
    </section>
  );
}
