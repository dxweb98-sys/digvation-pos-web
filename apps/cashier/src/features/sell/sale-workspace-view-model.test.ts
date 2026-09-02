import { describe, expect, it } from 'vitest';

import type { Sale } from './cashier-transaction.types';
import { createSaleWorkspaceViewModel } from './sale-workspace-view-model';

const baseSale: Sale = {
  id: '33333333-3333-4333-8333-333333333333',
  sellingLocationId: '11111111-1111-4111-8111-111111111111',
  currency: 'IDR',
  status: 'OPEN',
  version: 1,
  grossAmount: '0.0000',
  discountAmount: '0.0000',
  netPreTaxAmount: '0.0000',
  taxAmount: '0.0000',
  totalAmount: '0.0000',
  createdAt: '2026-09-02T00:00:00.000Z',
  updatedAt: '2026-09-02T00:00:00.000Z',
  lines: [],
  payments: [],
};

describe('createSaleWorkspaceViewModel', () => {
  it('keeps an open sale monetarily mutable when clean and online', () => {
    const viewModel = createSaleWorkspaceViewModel(baseSale, 'ONLINE', 'CLEAN');

    expect(viewModel.primaryMode).toBe('OPEN_ACTIVE');
    expect(viewModel.monetaryMutation).toEqual({ state: 'AVAILABLE' });
  });

  it('blocks monetary mutation while a payment is pending', () => {
    const viewModel = createSaleWorkspaceViewModel(
      {
        ...baseSale,
        payments: [
          {
            id: '44444444-4444-4444-8444-444444444444',
            status: 'PENDING',
            appliedAmount: '50000.0000',
          },
        ],
      },
      'ONLINE',
      'CLEAN',
    );

    expect(viewModel.primaryMode).toBe('PAYMENT_PENDING_ATTENTION');
    expect(viewModel.monetaryMutation).toEqual({
      state: 'DISABLED',
      reason: 'PAYMENT_PENDING',
    });
  });

  it('treats conflict review as a synchronization overlay', () => {
    const viewModel = createSaleWorkspaceViewModel(baseSale, 'ONLINE', 'CONFLICT_REVIEW');

    expect(viewModel.primaryMode).toBe('CONFLICT_REVIEW');
    expect(viewModel.monetaryMutation).toEqual({
      state: 'DISABLED',
      reason: 'CONFLICT_REVIEW',
    });
  });

  it('blocks business mutations while offline', () => {
    const viewModel = createSaleWorkspaceViewModel(baseSale, 'OFFLINE', 'CLEAN');

    expect(viewModel.monetaryMutation).toEqual({ state: 'DISABLED', reason: 'OFFLINE' });
  });
});
