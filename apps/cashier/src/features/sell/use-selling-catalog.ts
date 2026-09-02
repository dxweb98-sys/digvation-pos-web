import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { cashierTransactionKeys } from './cashier-transaction.keys';
import type { SellingCatalogQuery } from './cashier-transaction.adapter';
import type { CatalogItem, CatalogVariant, ResolvedPrice } from './cashier-transaction.types';

interface UseSellingCatalogOptions {
  query: SellingCatalogQuery;
  selectedLocationId: string | null;
  currency: string;
  locale: string;
  onAutoSelectLocation: (locationId: string) => void;
}

export function useSellingCatalog({
  query,
  selectedLocationId,
  currency,
  locale,
  onAutoSelectLocation,
}: UseSellingCatalogOptions) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const locationsQuery = useQuery({
    queryKey: cashierTransactionKeys.locations(),
    queryFn: ({ signal }) => query.listSellingLocations(signal),
  });
  const categoriesQuery = useQuery({
    queryKey: cashierTransactionKeys.categories(),
    queryFn: ({ signal }) => query.listCatalogCategories(signal),
  });
  const itemsQuery = useQuery({
    queryKey: cashierTransactionKeys.items(),
    queryFn: ({ signal }) => query.listCatalogItems(signal),
  });

  const locations = useMemo(
    () => (locationsQuery.data?.items ?? []).filter((location) => location.status === 'ACTIVE'),
    [locationsQuery.data],
  );
  const categories = useMemo(
    () => (categoriesQuery.data?.items ?? []).filter((category) => category.status === 'ACTIVE'),
    [categoriesQuery.data],
  );
  const activeItems = useMemo(
    () => (itemsQuery.data?.items ?? []).filter((item) => item.lifecycle === 'ACTIVE'),
    [itemsQuery.data],
  );
  const items = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase(locale);
    return activeItems.filter((item) => {
      if (categoryId && item.categoryId !== categoryId) return false;
      if (!normalizedSearch) return true;
      return `${item.name} ${item.code}`.toLocaleLowerCase(locale).includes(normalizedSearch);
    });
  }, [activeItems, categoryId, locale, search]);

  useEffect(() => {
    if (!selectedLocationId && locations.length === 1) {
      onAutoSelectLocation(locations[0]!.id);
    }
  }, [locations, onAutoSelectLocation, selectedLocationId]);

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
    locations,
    categories,
    items,
    priceByItemId,
    search,
    categoryId,
    error: locationsQuery.error ?? categoriesQuery.error ?? itemsQuery.error,
    isLoading: locationsQuery.isLoading || categoriesQuery.isLoading || itemsQuery.isLoading,
    setSearch,
    setCategoryId,
    loadActiveVariants,
  };
}
