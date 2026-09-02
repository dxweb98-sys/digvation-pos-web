import type { ConnectivityState } from '@digvation/pos-runtime';

import type { Sale, SaleLine } from './cashier-transaction.types';

export type SaleWorkspacePrimaryMode =
  | 'EMPTY'
  | 'OPEN_ACTIVE'
  | 'PAYMENT_PENDING_ATTENTION'
  | 'CONFLICT_REVIEW'
  | 'FINALIZED'
  | 'VOIDED';

export type SynchronizationState = 'CLEAN' | 'MUTATING' | 'CONFLICT_REVIEW' | 'UNCERTAIN_COMMAND';

export type ActionBlockReason =
  'SALE_TERMINAL' | 'PAYMENT_PENDING' | 'OFFLINE' | 'CONFLICT_REVIEW' | 'MUTATION_IN_PROGRESS';

export type ActionAvailability =
  { state: 'AVAILABLE' } | { state: 'HIDDEN' } | { state: 'DISABLED'; reason: ActionBlockReason };

export interface SaleWorkspaceViewModel {
  primaryMode: SaleWorkspacePrimaryMode;
  sale: Sale | null;
  activeLines: SaleLine[];
  hasPendingPayment: boolean;
  connectivity: ConnectivityState;
  synchronization: SynchronizationState;
  monetaryMutation: ActionAvailability;
}

function monetaryMutationAvailability(
  sale: Sale | null,
  connectivity: ConnectivityState,
  synchronization: SynchronizationState,
): ActionAvailability {
  if (connectivity === 'OFFLINE') {
    return { state: 'DISABLED', reason: 'OFFLINE' };
  }

  if (synchronization === 'CONFLICT_REVIEW' || synchronization === 'UNCERTAIN_COMMAND') {
    return { state: 'DISABLED', reason: 'CONFLICT_REVIEW' };
  }

  if (synchronization === 'MUTATING') {
    return { state: 'DISABLED', reason: 'MUTATION_IN_PROGRESS' };
  }

  if (!sale) return { state: 'AVAILABLE' };

  if (sale.status !== 'OPEN') {
    return { state: 'DISABLED', reason: 'SALE_TERMINAL' };
  }

  if (sale.payments.some((payment) => payment.status === 'PENDING')) {
    return { state: 'DISABLED', reason: 'PAYMENT_PENDING' };
  }

  return { state: 'AVAILABLE' };
}

export function createSaleWorkspaceViewModel(
  sale: Sale | null,
  connectivity: ConnectivityState,
  synchronization: SynchronizationState,
): SaleWorkspaceViewModel {
  const activeLines = sale?.lines.filter((line) => line.removedAt === null) ?? [];
  const hasPendingPayment = sale?.payments.some((payment) => payment.status === 'PENDING') ?? false;

  let primaryMode: SaleWorkspacePrimaryMode = 'EMPTY';

  if (sale?.status === 'FINALIZED') primaryMode = 'FINALIZED';
  else if (sale?.status === 'VOIDED') primaryMode = 'VOIDED';
  else if (synchronization === 'CONFLICT_REVIEW' || synchronization === 'UNCERTAIN_COMMAND') {
    primaryMode = 'CONFLICT_REVIEW';
  } else if (hasPendingPayment) primaryMode = 'PAYMENT_PENDING_ATTENTION';
  else if (sale) primaryMode = 'OPEN_ACTIVE';

  return {
    primaryMode,
    sale,
    activeLines,
    hasPendingPayment,
    connectivity,
    synchronization,
    monetaryMutation: monetaryMutationAvailability(sale, connectivity, synchronization),
  };
}

export function actionBlockMessage(reason: ActionBlockReason): string {
  switch (reason) {
    case 'SALE_TERMINAL':
      return 'This Sale is already terminal.';
    case 'PAYMENT_PENDING':
      return 'A pending payment blocks monetary changes.';
    case 'OFFLINE':
      return 'Reconnect before changing this Sale.';
    case 'CONFLICT_REVIEW':
      return 'Review the latest server state before continuing.';
    case 'MUTATION_IN_PROGRESS':
      return 'Wait for the current change to finish.';
  }
}
