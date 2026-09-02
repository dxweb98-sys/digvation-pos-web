import type { ConnectivityState } from '@digvation/pos-runtime';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';

import type { SaleTransactionClient } from './cashier-transaction.adapter';
import {
  cashierTransactionErrorMessage,
  isApiErrorCode,
  isKnownApiFailure,
  isSaleVersionConflict,
} from './cashier-transaction-errors';
import { cashierTransactionKeys } from './cashier-transaction-keys';
import type { Sale, SaleLine } from './cashier-transaction.types';
import {
  createSaleWorkspaceViewModel,
  type SynchronizationState,
} from './sale-workspace-view-model';

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

interface UseSaleWorkspaceControllerOptions {
  client: SaleTransactionClient;
  routeSaleId?: string;
  selectedLocationId: string | null;
  currency: string;
  connectivity: ConnectivityState;
  selectLocation: (locationId: string | null) => void;
  rememberSale: (saleId: string) => void;
}

function createIdempotencyKey(operation: string): string {
  return `cashier-${operation}-${crypto.randomUUID()}`;
}

function isPositiveQuantity(value: string): boolean {
  if (!QUANTITY_PATTERN.test(value)) return false;
  const [whole, fraction = ''] = value.split('.');
  return whole !== '0' || /[1-9]/.test(fraction);
}

export function useSaleWorkspaceController({
  client,
  routeSaleId,
  selectedLocationId,
  currency,
  connectivity,
  selectLocation,
  rememberSale,
}: UseSaleWorkspaceControllerOptions) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createdSaleIdRef = useRef<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [synchronization, setSynchronization] = useState<SynchronizationState>('CLEAN');
  const [retryIntent, setRetryIntent] = useState<AddItemIntent | null>(null);

  const saleQuery = useQuery({
    queryKey: cashierTransactionKeys.sale(routeSaleId ?? 'idle'),
    queryFn: ({ signal }) => client.getSale(routeSaleId!, signal),
    enabled: Boolean(routeSaleId),
  });
  const employeesQuery = useQuery({
    queryKey: ['cashier-transaction', 'employees'],
    queryFn: ({ signal }) => client.listEmployees(signal),
    enabled: Boolean(routeSaleId),
  });

  useEffect(() => {
    const sale = saleQuery.data;
    if (!sale) return;
    rememberSale(sale.id);
    if (selectedLocationId !== sale.sellingLocationId) selectLocation(sale.sellingLocationId);
  }, [rememberSale, saleQuery.data, selectLocation, selectedLocationId]);

  const refetchSale = async (saleId: string): Promise<Sale | null> => {
    try {
      const latest = await client.getSale(saleId);
      queryClient.setQueryData(cashierTransactionKeys.sale(saleId), latest);
      return latest;
    } catch (error) {
      setNotice(cashierTransactionErrorMessage(error));
      return null;
    }
  };

  const recoverFailure = async (error: unknown, saleId?: string) => {
    if (isSaleVersionConflict(error)) {
      if (saleId) await refetchSale(saleId);
      setSynchronization('CONFLICT_REVIEW');
      setNotice(
        'This Sale changed on another terminal. Review the latest server state before continuing.',
      );
      return;
    }

    if (isApiErrorCode(error, 'SALE_PAYMENT_PENDING')) {
      if (saleId) await refetchSale(saleId);
      setSynchronization('CLEAN');
      setNotice(cashierTransactionErrorMessage(error));
      return;
    }

    if (!isKnownApiFailure(error)) {
      if (saleId) await refetchSale(saleId);
      setSynchronization('UNCERTAIN_COMMAND');
      setNotice(
        saleId
          ? 'The command result is uncertain. The latest Sale was reloaded; review it before continuing.'
          : 'Sale creation is uncertain. Retry the same command so the backend can resolve the idempotency key safely.',
      );
      return;
    }

    setSynchronization('CLEAN');
    setNotice(cashierTransactionErrorMessage(error));
  };

  const addItemMutation = useMutation({
    mutationFn: async (intent: AddItemIntent) => {
      if (connectivity === 'OFFLINE') throw new Error('Reconnect before changing this Sale.');

      let saleId = intent.saleId;
      let expectedVersion = intent.expectedVersion;
      createdSaleIdRef.current = saleId ?? null;

      if (!saleId || expectedVersion === undefined) {
        const createdSale = await client.createSale(
          { sellingLocationId: intent.sellingLocationId, currency: intent.currency },
          intent.createIdempotencyKey,
        );
        saleId = createdSale.id;
        expectedVersion = createdSale.version;
        createdSaleIdRef.current = createdSale.id;
        queryClient.setQueryData(cashierTransactionKeys.sale(createdSale.id), createdSale);
        rememberSale(createdSale.id);
        selectLocation(createdSale.sellingLocationId);
        navigate(`/sell/${createdSale.id}`, { replace: true });
        setRetryIntent({ ...intent, saleId, expectedVersion });
      }

      return client.addSaleLine(
        saleId,
        {
          expectedVersion,
          catalogItemId: intent.catalogItemId,
          ...(intent.catalogVariantId ? { catalogVariantId: intent.catalogVariantId } : {}),
          quantity: intent.quantity,
        },
        intent.addIdempotencyKey,
      );
    },
    onSuccess: (sale) => {
      queryClient.setQueryData(cashierTransactionKeys.sale(sale.id), sale);
      queryClient.invalidateQueries({ queryKey: cashierTransactionKeys.sales() });
      rememberSale(sale.id);
      createdSaleIdRef.current = null;
      setRetryIntent(null);
      setSynchronization('CLEAN');
      setNotice(null);
    },
    onError: async (error, intent) => {
      const saleId = intent.saleId ?? createdSaleIdRef.current ?? undefined;
      if (isKnownApiFailure(error)) setRetryIntent(null);
      await recoverFailure(error, saleId);
    },
  });

  const quantityMutation = useMutation({
    mutationFn: (intent: {
      saleId: string;
      saleLineId: string;
      expectedVersion: number;
      quantity: string;
    }) => {
      if (connectivity === 'OFFLINE') throw new Error('Reconnect before changing this Sale.');
      return client.setSaleLineQuantity(intent.saleId, intent.saleLineId, {
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
    onError: async (error, intent) => recoverFailure(error, intent.saleId),
  });

  const removeMutation = useMutation({
    mutationFn: (intent: { saleId: string; saleLineId: string; expectedVersion: number }) => {
      if (connectivity === 'OFFLINE') throw new Error('Reconnect before changing this Sale.');
      return client.removeSaleLine(intent.saleId, intent.saleLineId, intent.expectedVersion);
    },
    onSuccess: (sale) => {
      queryClient.setQueryData(cashierTransactionKeys.sale(sale.id), sale);
      queryClient.invalidateQueries({ queryKey: cashierTransactionKeys.sales() });
      setSynchronization('CLEAN');
      setNotice(null);
    },
    onError: async (error, intent) => recoverFailure(error, intent.saleId),
  });

  const contributionMutation = useMutation({
    mutationFn: async (intent: {
      sale: Sale;
      line: SaleLine;
      employeeIds: string[];
      contributors: Array<{ employeeId: string; shareRate?: string }>;
    }) => {
      if (connectivity === 'OFFLINE') throw new Error('Reconnect before changing this Sale.');
      let latest = intent.sale;
      if (intent.line.employeeAssignmentModeSnapshot !== 'NONE') {
        latest = await client.setSaleLineAssignments(latest.id, intent.line.id, {
          expectedVersion: latest.version,
          employeeIds: intent.employeeIds,
        });
      }
      if (intent.line.allowEmployeeContributionSnapshot) {
        latest = await client.setSaleLineContributions(latest.id, intent.line.id, {
          expectedVersion: latest.version,
          contributors: intent.contributors,
        });
      }
      return latest;
    },
    onSuccess: (sale) => {
      queryClient.setQueryData(cashierTransactionKeys.sale(sale.id), sale);
      queryClient.invalidateQueries({ queryKey: cashierTransactionKeys.sales() });
      setSynchronization('CLEAN');
      setNotice(null);
    },
    onError: async (error, intent) => recoverFailure(error, intent.sale.id),
  });

  const paymentMutation = useMutation({
    mutationFn: (intent: {
      sale: Sale;
      method: 'CASH' | 'BANK_TRANSFER' | 'WALLET' | 'QRIS';
      appliedAmount: string;
      tenderedAmount?: string;
      providerReference?: string;
    }) => {
      if (connectivity === 'OFFLINE') throw new Error('Reconnect before changing this Sale.');
      return client.createPayment(
        intent.sale.id,
        {
          expectedVersion: intent.sale.version,
          method: intent.method,
          appliedAmount: intent.appliedAmount,
          ...(intent.tenderedAmount ? { tenderedAmount: intent.tenderedAmount } : {}),
          ...(intent.providerReference ? { providerReference: intent.providerReference } : {}),
        },
        createIdempotencyKey('create-payment'),
      );
    },
    onSuccess: (sale) => {
      queryClient.setQueryData(cashierTransactionKeys.sale(sale.id), sale);
      queryClient.invalidateQueries({ queryKey: cashierTransactionKeys.sales() });
      setNotice(null);
    },
    onError: async (error, intent) => recoverFailure(error, intent.sale.id),
  });

  const settlementMutation = useMutation({
    mutationFn: (intent: {
      sale: Sale;
      paymentId: string;
      status: 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'EXPIRED';
    }) => {
      if (connectivity === 'OFFLINE') throw new Error('Reconnect before changing this Sale.');
      return client.settlePayment(intent.sale.id, intent.paymentId, {
        expectedVersion: intent.sale.version,
        status: intent.status,
      });
    },
    onSuccess: (sale) => {
      queryClient.setQueryData(cashierTransactionKeys.sale(sale.id), sale);
      queryClient.invalidateQueries({ queryKey: cashierTransactionKeys.sales() });
      setNotice(null);
    },
    onError: async (error, intent) => recoverFailure(error, intent.sale.id),
  });

  const fulfillmentMutation = useMutation({
    mutationFn: (intent: {
      sale: Sale;
      line: SaleLine;
      status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED';
    }) => {
      if (connectivity === 'OFFLINE') throw new Error('Reconnect before changing this Sale.');
      return client.transitionSaleLineFulfillment(intent.sale.id, intent.line.id, {
        expectedVersion: intent.sale.version,
        status: intent.status,
      });
    },
    onSuccess: (sale) => {
      queryClient.setQueryData(cashierTransactionKeys.sale(sale.id), sale);
      queryClient.invalidateQueries({ queryKey: cashierTransactionKeys.sales() });
      setSynchronization('CLEAN');
      setNotice(null);
    },
    onError: async (error, intent) => recoverFailure(error, intent.sale.id),
  });

  const finalizeMutation = useMutation({
    mutationFn: (sale: Sale) => {
      if (connectivity === 'OFFLINE') throw new Error('Reconnect before changing this Sale.');
      return client.finalizeSale(
        sale.id,
        { expectedVersion: sale.version },
        createIdempotencyKey('finalize-sale'),
      );
    },
    onSuccess: (sale) => {
      queryClient.setQueryData(cashierTransactionKeys.sale(sale.id), sale);
      queryClient.invalidateQueries({ queryKey: cashierTransactionKeys.sales() });
      setSynchronization('CLEAN');
      setNotice(null);
    },
    onError: async (error, sale) => recoverFailure(error, sale.id),
  });

  const isMutating =
    addItemMutation.isPending ||
    quantityMutation.isPending ||
    removeMutation.isPending ||
    contributionMutation.isPending ||
    paymentMutation.isPending ||
    settlementMutation.isPending ||
    fulfillmentMutation.isPending ||
    finalizeMutation.isPending;
  const effectiveSynchronization: SynchronizationState = isMutating ? 'MUTATING' : synchronization;
  const viewModel = createSaleWorkspaceViewModel(
    saleQuery.data ?? null,
    connectivity,
    effectiveSynchronization,
  );

  const addItem = (catalogItemId: string, catalogVariantId?: string) => {
    if (!selectedLocationId) {
      setNotice('Select a Branch before starting a Sale.');
      return;
    }
    if (viewModel.monetaryMutation.state !== 'AVAILABLE') return;

    const currentSale = saleQuery.data;
    const intent: AddItemIntent = {
      catalogItemId,
      ...(catalogVariantId ? { catalogVariantId } : {}),
      quantity: '1',
      sellingLocationId: currentSale?.sellingLocationId ?? selectedLocationId,
      currency: currentSale?.currency ?? currency,
      createIdempotencyKey: createIdempotencyKey('create-sale'),
      addIdempotencyKey: createIdempotencyKey('add-line'),
      ...(currentSale ? { saleId: currentSale.id, expectedVersion: currentSale.version } : {}),
    };

    setRetryIntent(intent);
    addItemMutation.mutate(intent);
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

  return {
    sale: saleQuery.data ?? null,
    viewModel,
    notice: notice ?? (saleQuery.error ? cashierTransactionErrorMessage(saleQuery.error) : null),
    isLoading: Boolean(routeSaleId) && saleQuery.isLoading,
    canRetryLastAdd: Boolean(retryIntent) && !addItemMutation.isPending,
    addItem,
    changeQuantity,
    removeLine,
    employees: (employeesQuery.data?.items ?? []).filter(
      (employee) => employee.status === 'ACTIVE',
    ),
    saveLineTeam: (
      line: SaleLine,
      employeeIds: string[],
      contributors: Array<{ employeeId: string; shareRate?: string }>,
    ) => {
      const sale = saleQuery.data;
      if (!sale || viewModel.monetaryMutation.state !== 'AVAILABLE') return;
      contributionMutation.mutate({ sale, line, employeeIds, contributors });
    },
    createPayment: (
      method: 'CASH' | 'BANK_TRANSFER' | 'WALLET' | 'QRIS',
      appliedAmount: string,
      tenderedAmount?: string,
      providerReference?: string,
    ) => {
      const sale = saleQuery.data;
      if (!sale || sale.status !== 'OPEN') return;
      paymentMutation.mutate({
        sale,
        method,
        appliedAmount,
        ...(tenderedAmount === undefined ? {} : { tenderedAmount }),
        ...(providerReference === undefined ? {} : { providerReference }),
      });
    },
    settlePayment: (
      paymentId: string,
      status: 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'EXPIRED',
    ) => {
      const sale = saleQuery.data;
      if (!sale || sale.status !== 'OPEN') return;
      settlementMutation.mutate({ sale, paymentId, status });
    },
    transitionLineFulfillment: (
      line: SaleLine,
      status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED',
    ) => {
      const sale = saleQuery.data;
      if (!sale || !line.fulfillment || viewModel.lifecycleMutation.state !== 'AVAILABLE') return;
      fulfillmentMutation.mutate({ sale, line, status });
    },
    finalizeSale: () => {
      const sale = saleQuery.data;
      if (!sale || viewModel.lifecycleMutation.state !== 'AVAILABLE') return;
      finalizeMutation.mutate(sale);
    },
    retryLastAdd: () => {
      if (!retryIntent || addItemMutation.isPending) return;
      setNotice(null);
      addItemMutation.mutate(retryIntent);
    },
    acknowledgeLatestState: () => {
      setSynchronization('CLEAN');
      setNotice(null);
    },
    reportError: (error: unknown) => setNotice(cashierTransactionErrorMessage(error)),
    clearNotice: () => setNotice(null),
    clearAttention: () => {
      setNotice(null);
      setSynchronization('CLEAN');
    },
  };
}
