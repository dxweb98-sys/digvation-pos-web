import { formatMoney } from '@digvation/pos-money';
import { Input, Skeleton } from '@digvation/pos-ui';
import { PackageSearch, Search, ShoppingBag, Wrench } from 'lucide-react';

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
    <section className="flex min-h-0 flex-col">
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-panel)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex w-full rounded-xl bg-[var(--color-surface-muted)] p-1 sm:w-auto">
            <span className="inline-flex h-8 items-center gap-2 rounded-lg bg-[var(--color-surface)] px-3 text-xs font-bold text-[var(--color-brand)] shadow-sm ring-1 ring-[var(--color-border)]">
              <ShoppingBag className="size-3.5" /> Catalog
            </span>
          </div>
          <label className="relative block w-full sm:w-72">
            <span className="sr-only">Search catalog</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <Input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search items..."
              className="h-9 bg-[var(--color-background)] pl-9 pr-3 text-xs"
            />
          </label>
        </div>

        <div
          className="mt-3 flex gap-2 overflow-x-auto pb-0.5"
          role="group"
          aria-label="Catalog category"
        >
          <button
            type="button"
            onClick={() => onCategoryChange('')}
            className={`h-8 shrink-0 rounded-lg px-3 text-xs font-semibold transition-colors ${
              categoryId === ''
                ? 'bg-[var(--color-brand)] text-white'
                : 'bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)]'
            }`}
          >
            All items
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => onCategoryChange(category.id)}
              className={`h-8 shrink-0 rounded-lg px-3 text-xs font-semibold transition-colors ${
                categoryId === category.id
                  ? 'bg-[var(--color-brand)] text-white'
                  : 'bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)]'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {!hasBranch ? (
        <div className="mt-3 rounded-[var(--radius-card)] bg-[var(--color-accent-yellow)]/35 p-4 text-sm font-semibold">
          Select a Branch before starting a Sale.
        </div>
      ) : null}

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {isLoading ? (
          Array.from({ length: 6 }, (item, index) => (
            <div
              key={index}
              className="aspect-[.88] rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
            >
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="mt-3 h-3 w-1/2" />
              <Skeleton className="mt-2 h-4 w-3/4" />
            </div>
          ))
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
              <button
                key={item.id}
                type="button"
                aria-label={`Add ${item.name}`}
                disabled={isMutationDisabled}
                onClick={() => onSelectItem(item)}
                className="group flex aspect-[.88] min-w-0 flex-col rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-left shadow-[var(--shadow-panel)] transition-[transform,box-shadow,border-color] duration-150 hover:border-[var(--color-brand)]/40 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div
                  className={`grid aspect-square w-full place-items-center rounded-xl ${
                    item.type === 'SERVICE'
                      ? 'bg-[var(--color-accent-lavender)]/45 text-[var(--color-brand)]'
                      : 'bg-[var(--color-brand)]/10 text-[var(--color-brand)]'
                  }`}
                >
                  {item.type === 'SERVICE' ? (
                    <Wrench className="size-7" />
                  ) : (
                    <ShoppingBag className="size-7" />
                  )}
                </div>
                <span className="mt-2 truncate font-mono text-[10px] text-[var(--color-text-muted)]">
                  {item.code}
                </span>
                <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-semibold leading-5">
                  {item.name}
                </h3>
                <p className="mt-auto pt-2 text-sm font-bold text-[var(--color-brand)] tabular-nums">
                  {price ? formatMoney(price.amount, price.currency, locale) : 'Price unavailable'}
                </p>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
