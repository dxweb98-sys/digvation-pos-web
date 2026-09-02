import { ApiClient } from '@digvation/pos-api';
import { useConnectivity, useRuntime } from '@digvation/pos-runtime';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';

import { useCashierSession } from '../../app/providers/cashier-session-provider';
import { HttpCashierTransactionAdapter } from './cashier-transaction.adapter';
import { cashierTransactionErrorMessage } from './cashier-transaction-errors';
import type { CatalogItem } from './cashier-transaction.types';
import type { VariantPickerState } from './components/variant-picker';
import { useSaleWorkspaceController } from './use-sale-workspace-controller';
import { useSellingCatalog } from './use-selling-catalog';

export function useCashierTransactionWorkspace(routeSaleId?: string) {
  const runtime = useRuntime();
  const connectivity = useConnectivity();
  const navigate = useNavigate();
  const { selectedLocationId, selectLocation, rememberSale } = useCashierSession();
  const [variantPicker, setVariantPicker] = useState<VariantPickerState | null>(null);
  const transactionAdapter = useMemo(
    () => new HttpCashierTransactionAdapter(new ApiClient({ baseUrl: runtime.apiBaseUrl })),
    [runtime.apiBaseUrl],
  );

  const catalog = useSellingCatalog({
    query: transactionAdapter,
    selectedLocationId,
    currency: runtime.currency,
    locale: runtime.locale,
    onAutoSelectLocation: selectLocation,
  });

  const saleWorkspace = useSaleWorkspaceController({
    client: transactionAdapter,
    ...(routeSaleId === undefined ? {} : { routeSaleId }),
    selectedLocationId,
    currency: runtime.currency,
    connectivity: connectivity.state,
    selectLocation,
    rememberSale,
  });

  const selectItem = async (item: CatalogItem) => {
    saleWorkspace.clearNotice();
    try {
      const variants = await catalog.loadActiveVariants(item);
      if (variants.length > 0) {
        setVariantPicker({ item, variants });
        return;
      }
      saleWorkspace.addItem(item.id);
    } catch (error) {
      saleWorkspace.reportError(error);
    }
  };

  const selectVariant = (catalogVariantId: string | null) => {
    if (!variantPicker) return;
    const item = variantPicker.item;
    setVariantPicker(null);
    saleWorkspace.addItem(item.id, catalogVariantId ?? undefined);
  };

  const changeBranch = (locationId: string) => {
    const sale = saleWorkspace.sale;
    if (sale && locationId !== sale.sellingLocationId) {
      const confirmed = window.confirm(
        'Changing Branch leaves the current Sale OPEN and clears it from this workspace. Continue?',
      );
      if (!confirmed) return;
      navigate('/sell');
    }
    selectLocation(locationId || null);
    saleWorkspace.clearAttention();
  };

  const newSale = () => {
    if (saleWorkspace.sale) {
      const confirmed = window.confirm(
        'Start a new Sale? The current Sale remains OPEN and can be resumed from Open Sales.',
      );
      if (!confirmed) return;
    }
    navigate('/sell');
    saleWorkspace.clearAttention();
  };

  return {
    locale: runtime.locale,
    locations: catalog.locations,
    categories: catalog.categories,
    items: catalog.items,
    priceByItemId: catalog.priceByItemId,
    selectedLocationId: selectedLocationId ?? '',
    search: catalog.search,
    categoryId: catalog.categoryId,
    notice:
      saleWorkspace.notice ??
      (catalog.error ? cashierTransactionErrorMessage(catalog.error) : null),
    variantPicker,
    viewModel: saleWorkspace.viewModel,
    isLoadingCatalog: catalog.isLoading,
    isLoadingSale: saleWorkspace.isLoading,
    canRetryLastAdd: saleWorkspace.canRetryLastAdd,
    setSearch: catalog.setSearch,
    setCategoryId: catalog.setCategoryId,
    changeBranch,
    selectItem,
    selectVariant,
    closeVariantPicker: () => setVariantPicker(null),
    changeQuantity: saleWorkspace.changeQuantity,
    removeLine: saleWorkspace.removeLine,
    newSale,
    openSales: () => navigate('/open-sales'),
    acknowledgeLatestState: saleWorkspace.acknowledgeLatestState,
    retryLastAdd: saleWorkspace.retryLastAdd,
  };
}
