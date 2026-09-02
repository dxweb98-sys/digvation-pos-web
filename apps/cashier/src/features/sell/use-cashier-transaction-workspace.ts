import { ApiClient } from '@digvation/pos-api';
import { useConnectivity, useRuntime } from '@digvation/pos-runtime';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';

import { useCashierSession } from '../../app/providers/cashier-session-provider';
import { HttpCashierTransactionAdapter } from './cashier-transaction.adapter';
import { cashierTransactionErrorMessage } from './cashier-transaction-errors';
import { cashierTransactionKeys } from './cashier-transaction-keys';
import type { CatalogItem, SaleLine } from './cashier-transaction.types';
import type { VariantPickerState } from './components/variant-picker';
import { useEmployeeOptions } from './use-employee-options';
import { useSaleCommandCoordinator } from './use-sale-command-coordinator';
import { useSaleCoreController } from './use-sale-core-controller';
import { useSaleWorkspaceController } from './use-sale-workspace-controller';
import { useSellingCatalog } from './use-selling-catalog';

export function useCashierTransactionWorkspace(routeSaleId?: string) {
  const runtime = useRuntime();
  const connectivity = useConnectivity();
  const navigate = useNavigate();
  const { selectedLocationId, selectLocation, rememberSale } = useCashierSession();
  const [variantPicker, setVariantPicker] = useState<VariantPickerState | null>(null);
  const [lineTaskId, setLineTaskId] = useState<string | null>(null);
  const [isCompletionOpen, setCompletionOpen] = useState(false);
  const transactionAdapter = useMemo(
    () => new HttpCashierTransactionAdapter(new ApiClient({ baseUrl: runtime.apiBaseUrl })),
    [runtime.apiBaseUrl],
  );

  const command = useSaleCommandCoordinator({ client: transactionAdapter, rememberSale });

  const catalog = useSellingCatalog({
    query: transactionAdapter,
    selectedLocationId,
    currency: runtime.currency,
    locale: runtime.locale,
    onAutoSelectLocation: selectLocation,
  });

  const employeeOptions = useEmployeeOptions(transactionAdapter);

  const saleWorkspace = useSaleWorkspaceController({
    client: transactionAdapter,
    command,
    ...(routeSaleId === undefined ? {} : { routeSaleId }),
    selectedLocationId,
    currency: runtime.currency,
    connectivity: connectivity.state,
    selectLocation,
    rememberSale,
  });

  const core = useSaleCoreController({
    client: transactionAdapter,
    command,
    sale: saleWorkspace.sale,
    connectivity: connectivity.state,
  });

  const lineTask =
    saleWorkspace.sale?.lines.find((line) => line.id === lineTaskId && line.removedAt === null) ?? null;

  const contributionPreviewQuery = useQuery({
    queryKey: cashierTransactionKeys.contributionPreview(
      saleWorkspace.sale?.id ?? 'idle',
      lineTask?.id ?? 'idle',
    ),
    queryFn: ({ signal }) =>
      transactionAdapter.getSaleLineContributionPreview(saleWorkspace.sale!.id, lineTask!.id, signal),
    enabled: Boolean(saleWorkspace.sale && lineTask?.allowEmployeeContributionSnapshot),
  });

  const selectItem = async (item: CatalogItem) => {
    command.clearNotice();
    try {
      const variants = await catalog.loadActiveVariants(item);
      if (variants.length > 0) {
        setVariantPicker({ item, variants });
        return;
      }
      saleWorkspace.addItem(item.id);
    } catch (error) {
      command.reportError(error);
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
    command.clearAttention();
  };

  const newSale = () => {
    if (saleWorkspace.sale?.status === 'OPEN') {
      const confirmed = window.confirm(
        'Start a new Sale? The current Sale remains OPEN and can be resumed from Open Sales.',
      );
      if (!confirmed) return;
    }
    navigate('/sell');
    setCompletionOpen(false);
    setLineTaskId(null);
    command.clearAttention();
  };

  const retryLastCommand = () => {
    if (core.canRetryLastCoreCommand) core.retryLastCoreCommand();
    else saleWorkspace.retryLastAdd();
  };

  const openLineTask = (line: SaleLine) => setLineTaskId(line.id);

  return {
    locale: runtime.locale,
    locations: catalog.locations,
    categories: catalog.categories,
    items: catalog.items,
    priceByItemId: catalog.priceByItemId,
    employees: employeeOptions.employees,
    selectedLocationId: selectedLocationId ?? '',
    search: catalog.search,
    categoryId: catalog.categoryId,
    notice:
      command.notice ??
      (saleWorkspace.saleQueryError
        ? cashierTransactionErrorMessage(saleWorkspace.saleQueryError)
        : catalog.error
          ? cashierTransactionErrorMessage(catalog.error)
          : null),
    variantPicker,
    lineTask,
    contributionPreview: contributionPreviewQuery.data ?? null,
    isContributionPreviewLoading: contributionPreviewQuery.isLoading,
    isCompletionOpen,
    viewModel: saleWorkspace.viewModel,
    isLoadingCatalog: catalog.isLoading,
    isLoadingEmployees: employeeOptions.isLoading,
    isLoadingSale: saleWorkspace.isLoading,
    isCoreMutating: core.isPending,
    canRetryLastCommand: core.canRetryLastCoreCommand || saleWorkspace.canRetryLastAdd,
    setSearch: catalog.setSearch,
    setCategoryId: catalog.setCategoryId,
    changeBranch,
    selectItem,
    selectVariant,
    closeVariantPicker: () => setVariantPicker(null),
    changeQuantity: saleWorkspace.changeQuantity,
    removeLine: saleWorkspace.removeLine,
    openLineTask,
    closeLineTask: () => setLineTaskId(null),
    setPriceOverride: core.setPriceOverride,
    clearPriceOverride: core.clearPriceOverride,
    setLineDiscount: core.setLineDiscount,
    clearLineDiscount: core.clearLineDiscount,
    setAssignments: core.setAssignments,
    setContributions: core.setContributions,
    transitionFulfillment: core.transitionFulfillment,
    openCompletion: () => setCompletionOpen(true),
    closeCompletion: () => setCompletionOpen(false),
    setOrderDiscount: core.setOrderDiscount,
    clearOrderDiscount: core.clearOrderDiscount,
    createPayment: core.createPayment,
    transitionPayment: core.transitionPayment,
    finalizeSale: core.finalizeSale,
    voidSale: core.voidSale,
    newSale,
    openSales: () => navigate('/open-sales'),
    acknowledgeLatestState: command.acknowledgeLatestState,
    retryLastCommand,
  };
}
