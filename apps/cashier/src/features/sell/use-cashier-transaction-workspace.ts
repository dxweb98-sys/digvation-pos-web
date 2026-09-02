import { ApiClient, ApiError } from '@digvation/pos-api';
import { useConnectivity, useRuntime } from '@digvation/pos-runtime';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';

import { useCashierSession } from '../../app/providers/cashier-session-provider';
import { HttpCashierTransactionAdapter } from './cashier-transaction.adapter';
import { cashierTransactionKeys } from './cashier-transaction.keys';
import type {
  CatalogItem,
  CatalogVariant,
  ResolvedPrice,
  Sale,
  SaleLine,
  SellingLocation,
} from './cashier-transaction.types';
import {
  createSaleWorkspaceViewModel,
  type SynchronizationState,
} from './sale-workspace.view-model';
import type { VariantPickerState } from './components/variant-picker';

const QUANTITY_PATTERN = /^(0|[1-9]\d{0,14})(\.\d{1,4})?$/;

interface AddItemIntent {
  catalogItemId: string;
  catalogVariantId?: string;
  quantity: string;
  sellingLocationId: string;
  currency: string;
  createIdempotencyKey: string;
  addIdempotencyKey: string;
  saleId?: string;
  expectedVersion?: number;
}

interface QuantityIntent {
  saleId: string;
  saleLineId: string;
  expectedVersion: number;
  quantity: string;
}

interface RemoveIntent {
  saleId: string;
  saleLineId: string;
  expectedVersion: number;
}

function createIdempotencyKey(operation: string): string {
  return `cashier-${operation}-${crypto.randomUUID()}`;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.requestId ? `${error.message} · Request ${error.requestId}` : error.message;
  }
  return error instanceof Error ? error.message : 'Unexpected transaction error.';
}

function isPositiveQuantity(value: string): boolean {
  if (!QUANTITY_PATTERN.test(value)) return false;
  const [whole, fraction = ''] = value.split('.');
  return whole !== '0' || /[1-9]/.test(fraction);
}

export function useCashierTransactionWorkspace(routeSaleId?: string) {
  const runtime = useRuntime();
  const connectivity = useConnectivity();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { selectedLocationId, selectLocation, rememberSale } = useCashierSession();
  const transactionPort = useMemo(
    () => new HttpCashierTransactionAdapter(new ApiClient({ baseUrl: runtime.apiBaseUrl })),
    [runtime.apiBaseUrl],
  );

  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [synchronization, setSynchronization] = useState<SynchronizationState>('CLEAN');
  const [variantPicker, setVariantPicker] = useState<VariantPickerState | null>(null);
  const [retryIntent, setRetryIntent] = useState<AddItemIntent | null>(null);

  const locationsQuery = useQuery({
    queryKey: cashierTransactionKeys.locations(),
    queryFn: ({ signal }) => transactionPort.listSellingLocations(signal),
  });
  const categoriesQuery = useQuery({
    queryKey: cashierTransactionKeys.categories(),
    queryFn: ({ signal }) => transactionPort.listCatalogCategories(signal),
  });
  const catalogQuery = useQuery({
    queryKey: cashierTransactionKeys.items(),
    queryFn: ({ signal }) => transactionPort.listCatalogItems(signal),
  });
  const saleQuery = useQuery({
    queryKey: routeSaleId ? cashierTransactionKeys.sale(routeSaleId) : ['cashier-transaction', 'sale', 'none'],
    queryFn: ({ signal }) => transactionPort.getSale(routeSaleId!, signal),
    enabled: Boolean(routeSaleId),
  });

  const activeLocations = useMemo(
    () => (locationsQuery.data?.items ?? []).filter((location) => location.status === 'ACTIVE'),
    [locationsQuery.data],
  );
  const activeCategories = useMemo(
    () => (categoriesQuery.data?.items ?? []).filter((category) => category.status === 'ACTIVE'),
    [categoriesQuery.data],
  );
  const activeItems = useMemo(
    () => (catalogQuery.data?.items ?? []).filter((item) => item.lifecycle === 'ACTIVE'),
    [catalogQuery.data],
  );
  const visibleItems = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase(runtime.locale);
    return activeItems.filter((item) => {
      if (categoryId && item.categoryId !== categoryId) return false;
      if (!normalizedSearch) return true;
      return `${item.name} ${item.code}`.toLocaleLowerCase(runtime.locale).includes(normalizedSearch);
    });
  }, [activeItems, categoryId, runtime.locale, search]);

  useEffect(() => {
    if (!selectedLocationId && activeLocations.length === 1) {
      selectLocation(activeLocations[0]!.id);
    }
  }, [activeLocations, selectLocation, selectedLocationId]);

  useEffect(() => {
    const sale = saleQuery.data;
    if (!sale) return;
    rememberSale(sale.id);
    if (selectedLocationId !== sale.sellingLocationId) {
      selectLocation(sale.sellingLocationId);
    }
  }, [rememberSale, saleQuery.data, selectLocation, selectedLocationId]);

  const priceQueries = useQueries({
    queries: visibleItems.map((item) => ({
      queryKey: selectedLocationId
        ? cashierTransactionKeys.resolvedPrice(item.id, null, selectedLocationId, runtime.currency)
        : ['cashier-transaction', 'resolved-price', item.id, 'disabled'],
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        transactionPort.resolvePrice(
          {
            catalogItemId: item.id,
            sellingLocationId: selectedLocationId!,
            currency: runtime.currency,
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
    visibleItems.forEach((item, index) => {
      const price = priceQueries[index]?.data;
      if (price) prices.set(item.id, price);
    });
    return prices;
  }, [priceQueries, visibleItems]);

  const refetchSale = async (saleId: string): Promise<Sale | null> => {
    try {
      const latest = await transactionPort.getSale(saleId);
      queryClient.setQueryData(cashierTransactionKeys.sale(saleId), latest);
      return latest;
    } catch (error) {
      setNotice(getErrorMessage(error));
      return null;
    }
  };

  const recoverCommandFailure = async (error: unknown, saleId?: string) => {
    if (error instanceof ApiError && error.code === 'SALE_VERSION_CONFLICT') {
      if (saleId) await refetchSale(saleId);
      setSynchronization('CONFLICT_REVIEW');
      setNotice('This Sale changed on another terminal. Review the latest server state before continuing.');
      return;
    }

    if (!(error instanceof ApiError) && saleId) {
      await refetchSale(saleId);
      setSynchronization('UNCERTAIN_COMMAND');
      setNotice('The command result is uncertain. The latest Sale was reloaded; review it before continuing.');
      return;
    }

    setSynchronization('CLEAN');
    setNotice(getErrorMessage(error));
  };

  const startItemMutation = useMutation({
    mutationFn: async (intent: AddItemIntent) => {
      if (!connectivity.isOnline) throw new Error('Reconnect before changing this Sale.');

      let saleId = intent.saleId;
      let expectedVersion = intent.expectedVersion;

      if (!saleId || expectedVersion === undefined) {
        const createdSale = await transactionPort.createSale(
          { sellingLocationId: intent.sellingLocationId, currency: intent.currency },
          intent.createIdempotencyKey,
        );
        saleId = createdSale.id;
        expectedVersion = createdSale.version;
        queryClient.setQueryData(cashierTransactionKeys.sale(createdSale.id), createdSale);
        rememberSale(createdSale.id);
        selectLocation(createdSale.sellingLocationId);
        navigate(`/sell/${createdSale.id}`, { replace: true });
        setRetryIntent({ ...intent, saleId, expectedVersion });
      }

      const addedSale = await transactionPort.addSaleLine(
        saleId,
        {
          expectedVersion,
          catalogItemId: intent.catalogItemId,
          ...(intent.catalogVariantId ? { catalogVariantId: intent.catalogVariantId } : {}),
          quantity: intent.quantity,
        },
        intent.addIdempotencyKey,
      );

      return addedSale;
    },
    onSuccess: (sale) => {
      queryClient.setQueryData(cashierTransactionKeys.sale(sale.id), sale);
      queryClient.invalidateQueries({ queryKey: cashierTransactionKeys.sales() });
      rememberSale(sale.id);
      setRetryIntent(null);
      setSynchronization('CLEAN');
      setNotice(null);
    },
    onError: async (error, intent) => {
      const saleId = intent.saleId ?? retryIntent?.saleId;
      if (error instanceof ApiError) setRetryIntent(null);
      await recoverCommandFailure(error, saleId);
    },
  });

  const quantityMutation = useMutation({
    mutationFn: (intent: QuantityIntent) => {
      if (!connectivity.isOnline) throw new Error('Reconnect before changing this Sale.');
      return transactionPort.setSaleLineQuantity(intent.saleId, intent.saleLineId, {
        expectedVersion: intent.expectedVersion,
        quantity: intent.quantity,
      });
    },
    onSuccess: (sale) => {
      queryClient.setQueryData(cashierTransactionKeys.sale(sale.id), sale);
      queryClient.invalidateQueries({ queryKey: cashierTransactionKeys.sales() });
      setSynchronization('CLEAN');
      setNotice(null);
    },
    onError: async (error, intent) => recoverCommandFailure(error, intent.saleId),
  });

  const removeMutation = useMutation({
    mutationFn: (intent: RemoveIntent) => {
      if (!connectivity.isOnline) throw new Error('Reconnect before changing this Sale.');
      return transactionPort.removeSaleLine(intent.saleId, intent.saleLineId, intent.expectedVersion);
    },
    onSuccess: (sale) => {
      queryClient.setQueryData(cashierTransactionKeys.sale(sale.id), sale);
      queryClient.invalidateQueries({ queryKey: cashierTransactionKeys.sales() });
      setSynchronization('CLEAN');
      setNotice(null);
    },
    onError: async (error, intent) => recoverCommandFailure(error, intent.saleId),
  });

  const isMutating =
    startItemMutation.isPending || quantityMutation.isPending || removeMutation.isPending;
  const effectiveSynchronization: SynchronizationState = isMutating
    ? 'MUTATING'
    : synchronization;
  const viewModel = createSaleWorkspaceViewModel(
    saleQuery.data ?? null,
    connectivity.state,
    effectiveSynchronization,
  );

  const beginAdd = (item: CatalogItem, catalogVariantId?: string) => {
    if (!selectedLocationId) {
      setNotice('Select a Branch before starting a Sale.');
      return;
    }
    if (viewModel.monetaryMutation.state !== 'AVAILABLE') return;

    const currentSale = saleQuery.data;
    const intent: AddItemIntent = {
      catalogItemId: item.id,
      ...(catalogVariantId ? { catalogVariantId } : {}),
      quantity: '1',
      sellingLocationId: currentSale?.sellingLocationId ?? selectedLocationId,
      currency: currentSale?.currency ?? runtime.currency,
      createIdempotencyKey: createIdempotencyKey('create-sale'),
      addIdempotencyKey: createIdempotencyKey('add-line'),
      ...(currentSale ? { saleId: currentSale.id, expectedVersion: currentSale.version } : {}),
    };

    setRetryIntent(intent);
    startItemMutation.mutate(intent);
  };

  const selectItem = async (item: CatalogItem) => {
    setNotice(null);
    try {
      const page = await queryClient.fetchQuery({
        queryKey: cashierTransactionKeys.variants(item.id),
        queryFn: ({ signal }) => transactionPort.listCatalogVariants(item.id, signal),
        staleTime: 60_000,
      });
      const variants = page.items.filter((variant: CatalogVariant) => variant.status === 'ACTIVE');
      if (variants.length > 0) {
        setVariantPicker({ item, variants });
        return;
      }
      beginAdd(item);
    } catch (error) {
      setNotice(getErrorMessage(error));
    }
  };

  const selectVariant = (catalogVariantId: string | null) => {
    if (!variantPicker) return;
    const item = variantPicker.item;
    setVariantPicker(null);
    beginAdd(item, catalogVariantId ?? undefined);
  };

  const changeQuantity = (line: SaleLine, quantity: string) => {
    const sale = saleQuery.data;
    if (!sale || viewModel.monetaryMutation.state !== 'AVAILABLE') return;
    if (!isPositiveQuantity(quantity)) {
      setNotice('Quantity must be greater than zero with at most four decimal places.');
      return;
    }
    quantityMutation.mutate({
      saleId: sale.id,
      saleLineId: line.id,
      expectedVersion: sale.version,
      quantity,
    });
  };

  const removeLine = (line: SaleLine) => {
    const sale = saleQuery.data;
    if (!sale || viewModel.monetaryMutation.state !== 'AVAILABLE') return;
    removeMutation.mutate({ saleId: sale.id, saleLineId: line.id, expectedVersion: sale.version });
  };

  const changeBranch = (locationId: string) => {
    const sale = saleQuery.data;
    if (sale && locationId !== sale.sellingLocationId) {
      const confirmed = window.confirm(
        'Changing Branch leaves the current Sale OPEN and clears it from this workspace. Continue?',
      );
      if (!confirmed) return;
      navigate('/sell');
    }
    selectLocation(locationId || null);
    setNotice(null);
    setSynchronization('CLEAN');
  };

  const newSale = () => {
    if (saleQuery.data) {
      const confirmed = window.confirm(
        'Start a new Sale? The current Sale remains OPEN and can be resumed from Open Sales.',
      );
      if (!confirmed) return;
    }
    navigate('/sell');
    setSynchronization('CLEAN');
    setNotice(null);
  };

  const acknowledgeLatestState = () => {
    setSynchronization('CLEAN');
    setNotice(null);
  };

  const retryLastAdd = () => {
    if (!retryIntent || startItemMutation.isPending) return;
    setNotice(null);
    startItemMutation.mutate(retryIntent);
  };

  const queryError =
    saleQuery.error ?? locationsQuery.error ?? categoriesQuery.error ?? catalogQuery.error;

  return {
    locations: activeLocations,
    categories: activeCategories,
    items: visibleItems,
    priceByItemId,
    selectedLocationId: selectedLocationId ?? '',
    search,
    categoryId,
    notice: notice ?? (queryError ? getErrorMessage(queryError) : null),
    variantPicker,
    viewModel,
    isLoadingCatalog: locationsQuery.isLoading || categoriesQuery.isLoading || catalogQuery.isLoading,
    isLoadingSale: Boolean(routeSaleId) && saleQuery.isLoading,
    canRetryLastAdd: Boolean(retryIntent) && !(retryIntent && startItemMutation.isPending),
    setSearch,
    setCategoryId,
    changeBranch,
    selectItem,
    selectVariant,
    closeVariantPicker: () => setVariantPicker(null),
    changeQuantity,
    removeLine,
    newSale,
    openSales: () => navigate('/open-sales'),
    acknowledgeLatestState,
    retryLastAdd,
  };
}
