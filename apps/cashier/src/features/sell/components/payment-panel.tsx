import { createDecimal, formatMoney } from '@digvation/pos-money';
import { Button } from '@digvation/pos-ui';
import { useMemo, useState } from 'react';

import type { Sale } from '../cashier-transaction.types';

interface PaymentPanelProps {
  sale: Sale;
  locale: string;
  disabled: boolean;
  onCreate: (
    method: 'CASH' | 'BANK_TRANSFER' | 'WALLET' | 'QRIS',
    appliedAmount: string,
    tenderedAmount?: string,
    providerReference?: string,
  ) => void;
  onSettle: (paymentId: string, status: 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'EXPIRED') => void;
}

export function PaymentPanel({ sale, locale, disabled, onCreate, onSettle }: PaymentPanelProps) {
  const [method, setMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'WALLET' | 'QRIS'>('CASH');
  const [appliedAmount, setAppliedAmount] = useState('');
  const [tenderedAmount, setTenderedAmount] = useState('');
  const [providerReference, setProviderReference] = useState('');
  const reservedAmount = useMemo(
    () =>
      sale.payments
        .filter((payment) => payment.status === 'PENDING' || payment.status === 'SUCCEEDED')
        .reduce((amount, payment) => amount.plus(payment.appliedAmount), createDecimal('0')),
    [sale.payments],
  );
  const amountDue = createDecimal(sale.totalAmount).minus(reservedAmount).toFixed();

  return (
    <section className="border-t border-[var(--color-border)] p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-bold">Payment</h3>
        <span className="text-sm font-bold tabular-nums">
          Due {formatMoney(amountDue, sale.currency, locale)}
        </span>
      </div>
      <p className="mt-1 text-xs text-[var(--color-text-muted)]">
        Due is display-only from the latest backend Sale and payment state. The backend validates
        every reservation and settlement.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <select
          value={method}
          onChange={(event) => setMethod(event.target.value as typeof method)}
          disabled={disabled}
          className="min-h-10 rounded border border-[var(--color-border)] px-2 text-sm"
        >
          <option value="CASH">Cash</option>
          <option value="BANK_TRANSFER">Bank transfer</option>
          <option value="WALLET">Wallet</option>
          <option value="QRIS">QRIS</option>
        </select>
        <input
          value={appliedAmount}
          onChange={(event) => setAppliedAmount(event.target.value)}
          disabled={disabled}
          inputMode="decimal"
          placeholder="Applied amount"
          className="min-h-10 rounded border border-[var(--color-border)] px-3 text-sm"
        />
        {method === 'CASH' ? (
          <input
            value={tenderedAmount}
            onChange={(event) => setTenderedAmount(event.target.value)}
            disabled={disabled}
            inputMode="decimal"
            placeholder="Cash tendered"
            className="min-h-10 rounded border border-[var(--color-border)] px-3 text-sm"
          />
        ) : null}
        {method !== 'CASH' ? (
          <input
            value={providerReference}
            onChange={(event) => setProviderReference(event.target.value)}
            disabled={disabled}
            placeholder="Provider reference (optional)"
            className="min-h-10 rounded border border-[var(--color-border)] px-3 text-sm"
          />
        ) : null}
      </div>
      <Button
        variant="secondary"
        className="mt-3 w-full"
        disabled={disabled || !appliedAmount.trim()}
        onClick={() =>
          onCreate(
            method,
            appliedAmount.trim(),
            method === 'CASH' ? tenderedAmount.trim() : undefined,
            method === 'CASH' ? undefined : providerReference.trim() || undefined,
          )
        }
      >
        Create payment
      </Button>
      {sale.payments.length ? (
        <div className="mt-4 grid gap-2">
          {sale.payments.map((payment) => (
            <div
              key={payment.id}
              className="rounded border border-[var(--color-border)] p-3 text-xs"
            >
              <div className="flex justify-between gap-3">
                <span>
                  {payment.method} · {payment.status}
                </span>
                <span className="tabular-nums">
                  {formatMoney(payment.appliedAmount, payment.currency, locale)}
                </span>
              </div>
              {payment.status === 'PENDING' ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button variant="ghost" onClick={() => onSettle(payment.id, 'SUCCEEDED')}>
                    Settle
                  </Button>
                  <Button variant="ghost" onClick={() => onSettle(payment.id, 'FAILED')}>
                    Fail
                  </Button>
                  <Button variant="ghost" onClick={() => onSettle(payment.id, 'CANCELLED')}>
                    Cancel
                  </Button>
                  <Button variant="ghost" onClick={() => onSettle(payment.id, 'EXPIRED')}>
                    Expire
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
