import { formatMoney } from '@digvation/pos-money';
import { Button } from '@digvation/pos-ui';
import { LoaderCircle, PackageSearch, Plus, Search } from 'lucide-react';

import type { CatalogCategory, CatalogItem, ResolvedPrice } from '../cashier-transaction.types';
import type { ActionAvailability } from '../sale-workspace-view-model';

interface SellingCatalogPaneProps {
  items: readonly CatalogItem[];
  categories: readonly CatalogCategory[];
  priceByItemId: ReadonlyMap<string, ResolvedPrice>;
  locale: string;
  search: string;
  categoryId: string;
  isLoading: boolean;
  availability: ActionAvailability;
  hasBranch: boolean;
  onSearchChange: (search: string) => void;
  onCategoryChange: (categoryId: string) => void;
  onSelectItem: (item: CatalogItem) => void;
}

export function SellingCatalogPane({
  items,
  categories,
  priceByItemId,
  locale,
  search,
  categoryId,
  isLoading,
  availability,
  hasBranch,
  onSearchChange,
  onCategoryChange,
  onSelectItem,
}: SellingCatalogPaneProps) {
  const isMutationDisabled = availability.state !== 'AVAILABLE' || !hasBranch;

  return (
    <section className="rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-panel)] lg:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
            Selling Catalog
          </p>
          <h2 className="mt-2 text-xl font-bold tracking-[-0.02em]">Choose an item</h2>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative block min-w-56">
            <span className="sr-only">Search catalog</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search item or code"
              className="min-h-11 w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
            />
          </label>
          <select
            aria-label="Catalog category"
            value={categoryId}
            onChange={(event) => onCategoryChange(event.target.value)}
            className="min-h-11 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!hasBranch ? (
        <div className="mt-5 rounded-[var(--radius-card)] bg-[var(--color-accent-yellow)]/35 p-4 text-sm font-semibold">
          Select a Branch before starting a Sale.
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full flex min-h-52 items-center justify-center text-sm text-[var(--color-text-muted)]">
            <LoaderCircle className="mr-2 size-4 animate-spin" /> Loading catalog…
          </div>
        ) : items.length === 0 ? (
          <div className="col-span-full rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] p-8 text-center">
            <PackageSearch className="mx-auto size-6 text-[var(--color-text-muted)]" />
            <p className="mt-3 text-sm font-bold">No matching active items</p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Try another search or category.
            </p>
          </div>
        ) : (
          items.map((item) => {
            const price = priceByItemId.get(item.id);

            return (
              <article
                key={item.id}
                className="flex min-h-44 flex-col rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${
                      item.type === 'SERVICE'
                        ? 'bg-[var(--color-accent-lavender)]'
                        : 'bg-[var(--color-accent-sky)]'
                    }`}
                  >
                    {item.type}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">{item.code}</span>
                </div>

                <h3 className="mt-4 line-clamp-2 text-sm font-bold">{item.name}</h3>
                <p className="mt-2 text-sm font-bold tabular-nums">
                  {price ? formatMoney(price.amount, price.currency, locale) : 'Price unavailable'}
                </p>

                <Button
                  variant="secondary"
                  className="mt-auto w-full"
                  disabled={isMutationDisabled}
                  onClick={() => onSelectItem(item)}
                >
                  <Plus className="mr-2 size-4" /> Add
                </Button>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
