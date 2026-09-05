import type { QueryClient } from '@tanstack/react-query';

import type { SellingCatalogQuery } from './cashier-transaction.adapter';
import { cashierTransactionKeys } from './cashier-transaction-keys';
import type { ResolvedPrice } from './cashier-transaction.types';

const RESOLVED_PRICE_STALE_TIME_MS = 90_000;

interface ResolvePriceInput {
  catalogItemId: string;
  catalogVariantId?: string | undefined;
  sellingLocationId: string;
  currency: string;
}

/** Reuses one bounded-staleness price resolution cache across Cashier interactions. */
export function fetchResolvedPrice(
  queryClient: QueryClient,
  query: SellingCatalogQuery,
  input: ResolvePriceInput,
): Promise<ResolvedPrice> {
  return queryClient.fetchQuery({
    queryKey: cashierTransactionKeys.resolvedPrice(
      input.catalogItemId,
      input.catalogVariantId ?? null,
      input.sellingLocationId,
      input.currency,
    ),
    queryFn: ({ signal }) =>
      query.resolvePrice(
        {
          catalogItemId: input.catalogItemId,
          ...(input.catalogVariantId ? { catalogVariantId: input.catalogVariantId } : {}),
          sellingLocationId: input.sellingLocationId,
          currency: input.currency,
          effectiveAt: new Date().toISOString(),
        },
        signal,
      ),
    staleTime: RESOLVED_PRICE_STALE_TIME_MS,
    retry: false,
  });
}
