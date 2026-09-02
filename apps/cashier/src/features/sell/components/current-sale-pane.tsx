import { formatMoney } from '@digvation/pos-money';
import { Button } from '@digvation/pos-ui';
import { ArrowRightLeft, Plus, ShoppingBag } from 'lucide-react';

import type { SaleLine } from '../cashier-transaction.types';
import { actionBlockMessage, type SaleWorkspaceViewModel } from '../sale-workspace-view-model';
import { SaleLineRow } from './sale-line-row';

interface CurrentSalePaneProps {
  viewModel: SaleWorkspaceViewModel;
  locale: string;
  onQuantityChange: (line: SaleLine, quantity: string) => void;
  onRemove: (line: SaleLine) => void;
  onNewSale: () => void;
  onOpenSales: () => void;
}

export function CurrentSalePane({
  viewModel,
  locale,
  onQuantityChange,
  onRemove,
  onNewSale,
  onOpenSales,
}: CurrentSalePaneProps) {
  const sale = viewModel.sale;

  if (!sale) {
    return (
      <section
        aria-label="Current Sale"
        className="flex min-h-[440px] flex-col rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-panel)]"
      >
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
          Current Sale
        </p>
        <div className="my-auto text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[var(--color-accent-mint)]">
            <ShoppingBag className="size-5" />
          </div>
          <h2 className="mt-4 text-lg font-bold">Ready for a new Sale</h2>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-[var(--color-text-muted)]">
            Choose an item. The Sale will be created only when the first item is actually added.
          </p>
        </div>
        <Button variant="secondary" onClick={onOpenSales}>
          <ArrowRightLeft className="mr-2 size-4" /> Open Sales
        </Button>
      </section>
    );
  }

  const disabledMessage =
    viewModel.monetaryMutation.state === 'DISABLED'
      ? actionBlockMessage(viewModel.monetaryMutation.reason)
      : null;

  return (
    <section
      aria-label="Current Sale"
      className="flex min-h-[520px] flex-col rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-panel)]"
    >
      <div className="border-b border-[var(--color-border)] p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-brand)]">
              Current Sale
            </p>
            <h2 className="mt-2 truncate text-lg font-bold">Sale {sale.id.slice(0, 8)}</h2>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Version {sale.version} · {sale.status}
            </p>
          </div>
          <Button variant="ghost" onClick={onOpenSales} className="px-3" aria-label="Open Sales">
            <ArrowRightLeft className="size-4" />
          </Button>
        </div>

        {viewModel.hasPendingPayment ? (
          <div className="mt-4 rounded-[var(--radius-control)] bg-[var(--color-accent-yellow)]/45 px-3 py-2 text-xs font-semibold">
            Payment is pending. Monetary Sale changes are locked by the backend.
          </div>
        ) : null}

        {disabledMessage && !viewModel.hasPendingPayment ? (
          <div className="mt-4 rounded-[var(--radius-control)] bg-[var(--color-surface-muted)] px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)]">
            {disabledMessage}
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {viewModel.activeLines.length === 0 ? (
          <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] p-5 text-center">
            <ShoppingBag className="mx-auto size-5 text-[var(--color-text-muted)]" />
            <p className="mt-3 text-sm font-semibold">This OPEN Sale has no active lines</p>
            <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
              This can happen when Sale creation succeeded but the first line did not commit.
            </p>
          </div>
        ) : (
          viewModel.activeLines.map((line) => (
            <SaleLineRow
              key={line.id}
              line={line}
              locale={locale}
              availability={viewModel.monetaryMutation}
              onQuantityChange={onQuantityChange}
              onRemove={onRemove}
            />
          ))
        )}
      </div>

      <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-muted)] p-5">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4 text-[var(--color-text-muted)]">
            <dt>Gross</dt>
            <dd className="tabular-nums">{formatMoney(sale.grossAmount, sale.currency, locale)}</dd>
          </div>
          <div className="flex justify-between gap-4 text-[var(--color-text-muted)]">
            <dt>Tax</dt>
            <dd className="tabular-nums">{formatMoney(sale.taxAmount, sale.currency, locale)}</dd>
          </div>
          <div className="flex justify-between gap-4 pt-2 text-base font-bold">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatMoney(sale.totalAmount, sale.currency, locale)}</dd>
          </div>
        </dl>

        <Button variant="secondary" className="mt-4 w-full" onClick={onNewSale}>
          <Plus className="mr-2 size-4" /> New Sale
        </Button>
      </div>
    </section>
  );
}
