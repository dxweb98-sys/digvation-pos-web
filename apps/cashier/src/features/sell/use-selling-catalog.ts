import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import type { SellingCatalogQuery } from './cashier-transaction.adapter';
import { cashierTransactionKeys } from './cashier-transaction-keys';
import type { CatalogItem, CatalogVariant, ResolvedPrice } from './cashier-transaction.types';

export type CatalogItemTypeFilter = 'ALL' | 'PRODUCT' | 'SERVICE';

interface UseSellingCatalogOptions {
  query: SellingCatalogQuery;
  selectedLocationId: string | null;
  currency: string;
  locale: string;
}

export function useSellingCatalog({
  query,
  selectedLocationId,
  currency,
  locale,
}: UseSellingCatalogOptions) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [itemType, setItemType] = useState<CatalogItemTypeFilter>('SERVICE');
  const itemsQuery = useQuery({
    queryKey: cashierTransactionKeys.items(),
    queryFn: ({ signal }) => query.listCatalogItems(signal),
  });

  const activeItems = useMemo(
    () => (itemsQuery.data?.items ?? []).filter((item) => item.lifecycle === 'ACTIVE'),
    [itemsQuery.data],
  );
  const items = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase(locale);
    return activeItems.filter((item) => {
      if (itemType !== 'ALL' && item.type !== itemType) return false;
      if (!normalizedSearch) return true;
      return `${item.name} ${item.code}`.toLocaleLowerCase(locale).includes(normalizedSearch);
    });
  }, [activeItems, itemType, locale, search]);

  const priceQueries = useQueries({
    queries: items.map((item) => ({
      queryKey: selectedLocationId
        ? cashierTransactionKeys.resolvedPrice(item.id, null, selectedLocationId, currency)
        : cashierTransactionKeys.resolvedPrice(item.id, null, 'unselected', currency),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        query.resolvePrice(
          {
            catalogItemId: item.id,
            sellingLocationId: selectedLocationId!,
            currency,
            effectiveAt: new Date().toISOString(),
          },
          signal,
        ),
      enabled: Boolean(selectedLocationId),
      staleTime: 60_000,
      retry: false,
    })),
  });

  const priceByItemId = useMemo(() => {
    const prices = new Map<string, ResolvedPrice>();
    items.forEach((item, index) => {
      const price = priceQueries[index]?.data;
      if (price) prices.set(item.id, price);
    });
    return prices;
  }, [items, priceQueries]);

  const loadActiveVariants = async (item: CatalogItem): Promise<CatalogVariant[]> => {
    const page = await queryClient.fetchQuery({
      queryKey: cashierTransactionKeys.variants(item.id),
      queryFn: ({ signal }) => query.listCatalogVariants(item.id, signal),
      staleTime: 60_000,
    });
    return page.items.filter((variant) => variant.status === 'ACTIVE');
  };

  return {
    items,
    priceByItemId,
    search,
    itemType,
    error: itemsQuery.error,
    isLoading: itemsQuery.isLoading,
    setSearch,
    setItemType,
    loadActiveVariants,
  };
}
