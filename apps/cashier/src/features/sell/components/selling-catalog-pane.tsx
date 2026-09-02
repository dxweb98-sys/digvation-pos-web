import { formatMoney } from '@digvation/pos-money';
import { Badge, Button, Input, Select, Skeleton } from '@digvation/pos-ui';
import { PackageSearch, Plus, Search } from 'lucide-react';

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
            <Input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search item or code"
              className="w-full pl-10 pr-3"
            />
          </label>
          <Select
            aria-label="Catalog category"
            value={categoryId}
            onChange={(event) => onCategoryChange(event.target.value)}
            className="font-medium"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {!hasBranch ? (
        <div className="mt-5 rounded-[var(--radius-card)] bg-[var(--color-accent-yellow)]/35 p-4 text-sm font-semibold">
          Select a Branch before starting a Sale.
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }, (item, index) => (
            <div
              key={index}
              className="min-h-44 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
            >
              <Skeleton className="h-5 w-20" />
              <Skeleton className="mt-6 h-4 w-3/4" />
              <Skeleton className="mt-3 h-4 w-1/2" />
              <Skeleton className="mt-6 h-10 w-full" />
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
              <article
                key={item.id}
                className="flex min-h-44 flex-col rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-3">
                  <Badge
                    className={`text-[10px] font-bold uppercase tracking-[0.1em] ${
                      item.type === 'SERVICE'
                        ? 'bg-[var(--color-accent-lavender)]'
                        : 'bg-[var(--color-accent-sky)]'
                    }`}
                  >
                    {item.type}
                  </Badge>
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
