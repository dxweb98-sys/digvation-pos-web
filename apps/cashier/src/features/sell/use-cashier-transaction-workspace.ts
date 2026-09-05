import { useConnectivity, useRuntime } from '@digvation/pos-runtime';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';

import { useCashierSession } from '../../app/providers/cashier-session-provider';
import { cashierTransactionErrorMessage } from './cashier-transaction-errors';
import { cashierTransactionKeys } from './cashier-transaction-keys';
import type { CatalogItem, Sale, SaleLine } from './cashier-transaction.types';
import { createCashierTransactionAdapter, isCashierDemoMode } from './cashier-transaction-client';
import type { VariantPickerContext, VariantPickerState } from './components/variant-picker';
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
  const [resumedSaleId, setResumedSaleId] = useState<string | null>(null);
  const transactionAdapter = useMemo(
    () => createCashierTransactionAdapter(runtime.apiBaseUrl),
    [runtime.apiBaseUrl],
  );
  const effectiveConnectivity = isCashierDemoMode() ? 'ONLINE' : connectivity.state;

  const command = useSaleCommandCoordinator({ client: transactionAdapter, rememberSale });

  const catalog = useSellingCatalog({
    query: transactionAdapter,
    selectedLocationId,
    currency: runtime.currency,
    locale: runtime.locale,
  });

  const employeeOptions = useEmployeeOptions(transactionAdapter);

  const activeSaleId = routeSaleId ?? resumedSaleId ?? undefined;
  const saleWorkspace = useSaleWorkspaceController({
    client: transactionAdapter,
    command,
    ...(activeSaleId === undefined ? {} : { routeSaleId: activeSaleId }),
    selectedLocationId,
    currency: runtime.currency,
    connectivity: effectiveConnectivity,
    selectLocation,
    rememberSale,
  });

  const core = useSaleCoreController({
    client: transactionAdapter,
    command,
    sale: saleWorkspace.sale,
    connectivity: effectiveConnectivity,
  });

  const lineTask =
    saleWorkspace.sale?.lines.find((line) => line.id === lineTaskId && line.removedAt === null) ??
    null;

  const contributionPreviewQuery = useQuery({
    queryKey: cashierTransactionKeys.contributionPreview(
      saleWorkspace.sale?.id ?? 'idle',
      lineTask?.id ?? 'idle',
    ),
    queryFn: ({ signal }) =>
      transactionAdapter.getSaleLineContributionPreview(
        saleWorkspace.sale!.id,
        lineTask!.id,
        signal,
      ),
    enabled: Boolean(saleWorkspace.sale && lineTask?.allowEmployeeContributionSnapshot),
  });

  const addCatalogItem = async (
    item: CatalogItem,
    catalogVariantId: string | undefined,
    context: VariantPickerContext,
    targetSaleId?: string,
  ) => {
    if (context === 'CART' && resumedSaleId) {
      throw new Error('Selesaikan penyesuaian transaksi sebelum menambahkan item ke cart.');
    }
    if (
      context === 'TRANSACTION_ADJUSTMENT' &&
      (!targetSaleId || resumedSaleId !== targetSaleId)
    ) {
      throw new Error('Transaksi yang akan disesuaikan tidak lagi aktif. Buka kembali penyesuaian.');
    }
    if (!selectedLocationId) {
      saleWorkspace.addItem(item.id, catalogVariantId);
      return;
    }
    const resolvedPrice =
      catalogVariantId === undefined
        ? (catalog.priceByItemId.get(item.id) ??
          (await transactionAdapter.resolvePrice({
            catalogItemId: item.id,
            sellingLocationId: selectedLocationId,
            currency: runtime.currency,
            effectiveAt: new Date().toISOString(),
          })))
        : await transactionAdapter.resolvePrice({
            catalogItemId: item.id,
            catalogVariantId,
            sellingLocationId: selectedLocationId,
            currency: runtime.currency,
            effectiveAt: new Date().toISOString(),
          });

    saleWorkspace.addItem(item.id, catalogVariantId, { catalogItem: item, resolvedPrice });
  };

  const selectItem = async (item: CatalogItem, context: VariantPickerContext = 'CART') => {
    command.clearNotice();
    try {
      const targetSaleId =
        context === 'TRANSACTION_ADJUSTMENT' ? (resumedSaleId ?? undefined) : undefined;
      if (context === 'TRANSACTION_ADJUSTMENT' && !targetSaleId) {
        throw new Error('Transaksi yang akan disesuaikan tidak lagi aktif. Buka kembali penyesuaian.');
      }
      const variants = await catalog.loadActiveVariants(item);
      if (variants.length > 0) {
        const priceEntries = selectedLocationId
          ? await Promise.all(
              variants.map(async (variant) => {
                const price = await transactionAdapter.resolvePrice({
                  catalogItemId: item.id,
                  catalogVariantId: variant.id,
                  sellingLocationId: selectedLocationId,
                  currency: runtime.currency,
                  effectiveAt: new Date().toISOString(),
                });
                return [variant.id, price.amount] as const;
              }),
            )
          : [];
        setVariantPicker({
          item,
          variants,
          pricesByVariantId: Object.fromEntries(priceEntries),
          locale: runtime.locale,
          currency: runtime.currency,
          context,
          ...(targetSaleId ? { targetSaleId } : {}),
        });
        return;
      }
      await addCatalogItem(item, undefined, context, targetSaleId);
    } catch (error) {
      command.reportError(error);
    }
  };

  const selectVariant = async (catalogVariantId: string | null) => {
    if (!variantPicker) return;
    const item = variantPicker.item;
    const context = variantPicker.context ?? 'CART';
    const targetSaleId = variantPicker.targetSaleId;
    setVariantPicker(null);
    try {
      await addCatalogItem(item, catalogVariantId ?? undefined, context, targetSaleId);
    } catch (error) {
      command.reportError(error);
    }
  };

  const newSale = () => {
    if (saleWorkspace.sale?.status === 'OPEN') {
      const confirmed = window.confirm(
        'Start a new Sale? The current Sale remains OPEN until it is finalized or voided.',
      );
      if (!confirmed) return;
    }
    navigate('/sell');
    setResumedSaleId(null);
    setCompletionOpen(false);
    setLineTaskId(null);
    command.clearAttention();
  };

  const clearProcessedDraft = () => {
    navigate('/sell');
    setResumedSaleId(null);
    setCompletionOpen(false);
    setLineTaskId(null);
    command.clearAttention();
  };

  const resumeSale = (saleId: string) => {
    setResumedSaleId(saleId);
    setCompletionOpen(false);
    setLineTaskId(null);
    command.clearAttention();
  };

  const retryLastCommand = () => {
    if (core.canRetryLastCoreCommand) core.retryLastCoreCommand();
    else saleWorkspace.retryLastAdd();
  };

  const openLineTask = (line: SaleLine) => setLineTaskId(line.id);

  const transitionQueuedFulfillment = async (
    sale: Sale,
    line: SaleLine,
    status: 'IN_PROGRESS' | 'COMPLETED',
  ) => {
    command.clearNotice();
    try {
      const updated = await command.runMutation(() =>
        transactionAdapter.transitionSaleLineFulfillment(sale.id, line.id, {
          expectedVersion: sale.version,
          status,
        }),
      );
      command.commitSale(updated);
      return updated;
    } catch (error) {
      command.reportError(error);
      throw error;
    }
  };

  const startQueuedFulfillment = (sale: Sale, line: SaleLine) =>
    transitionQueuedFulfillment(sale, line, 'IN_PROGRESS');

  const setQueuedAssignments = async (
    sale: Sale,
    line: SaleLine,
    employeeIds: string[],
    contributors: Array<{ employeeId: string; shareRate?: string }>,
  ) => {
    command.clearNotice();
    try {
      let updated = await command.runMutation(() =>
        transactionAdapter.setSaleLineAssignments(sale.id, line.id, {
          expectedVersion: sale.version,
          employeeIds,
        }),
      );
      if (line.allowEmployeeContributionSnapshot) {
        updated = await command.runMutation(() =>
          transactionAdapter.setSaleLineContributions(sale.id, line.id, {
            expectedVersion: updated.version,
            contributors,
          }),
        );
      }
      command.commitSale(updated);
      return updated;
    } catch (error) {
      command.reportError(error);
      throw error;
    }
  };

  const finalizeQueuedSale = async (sale: Sale) => {
    command.clearNotice();
    try {
      const updated = await command.runMutation(() =>
        transactionAdapter.finalizeSale(
          sale.id,
          sale.version,
          `cashier-finalize-${crypto.randomUUID()}`,
        ),
      );
      command.commitSale(updated);
      return updated;
    } catch (error) {
      command.reportError(error);
      throw error;
    }
  };

  return {
    locale: runtime.locale,
    currency: runtime.currency,
    items: catalog.items,
    priceByItemId: catalog.priceByItemId,
    employees: employeeOptions.employees,
    selectedLocationId: selectedLocationId ?? '',
    search: catalog.search,
    itemType: catalog.itemType,
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
    isCoreMutating: core.isPending || command.isMutating,
    canRetryLastCommand: core.canRetryLastCoreCommand || saleWorkspace.canRetryLastAdd,
    setSearch: catalog.setSearch,
    setItemType: catalog.setItemType,
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
    startQueuedFulfillment,
    transitionQueuedFulfillment,
    setQueuedAssignments,
    finalizeQueuedSale,
    openCompletion: () => setCompletionOpen(true),
    closeCompletion: () => setCompletionOpen(false),
    setOrderDiscount: core.setOrderDiscount,
    clearOrderDiscount: core.clearOrderDiscount,
    createPayment: core.createPayment,
    transitionPayment: core.transitionPayment,
    finalizeSale: core.finalizeSale,
    voidSale: core.voidSale,
    newSale,
    clearProcessedDraft,
    resumeSale,
    acknowledgeLatestState: command.acknowledgeLatestState,
    retryLastCommand,
  };
}
