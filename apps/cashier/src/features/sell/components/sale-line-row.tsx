import { compareDecimalStrings, createDecimal, formatMoney } from '@digvation/pos-money';
import { Button } from '@digvation/pos-ui';
import { Minus, Plus, Trash2 } from 'lucide-react';

import type { SaleLine } from '../cashier-transaction.types';
import type { ActionAvailability } from '../sale-workspace.view-model';

interface SaleLineRowProps {
  line: SaleLine;
  locale: string;
  availability: ActionAvailability;
  onQuantityChange: (line: SaleLine, quantity: string) => void;
  onRemove: (line: SaleLine) => void;
}

export function SaleLineRow({
  line,
  locale,
  availability,
  onQuantityChange,
  onRemove,
}: SaleLineRowProps) {
  const isDisabled = availability.state !== 'AVAILABLE';
  const canDecrease = !isDisabled && compareDecimalStrings(line.quantity, '1') > 0;

  const increase = () => {
    onQuantityChange(line, createDecimal(line.quantity).plus('1').toFixed());
  };

  const decrease = () => {
    if (!canDecrease) return;
    onQuantityChange(line, createDecimal(line.quantity).minus('1').toFixed());
  };

  return (
    <article className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{line.itemNameSnapshot}</p>
          <p className="mt-1 truncate text-xs text-[var(--color-text-muted)]">
            {line.variantNameSnapshot ? `${line.variantNameSnapshot} · ` : ''}
            {line.itemCodeSnapshot}
          </p>
        </div>
        <p className="shrink-0 text-sm font-bold tabular-nums">
          {formatMoney(line.totalAmount, line.currency, locale)}
        </p>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-1">
          <button
            type="button"
            aria-label={`Decrease ${line.itemNameSnapshot} quantity`}
            disabled={!canDecrease}
            onClick={decrease}
            className="grid size-9 place-items-center rounded-lg text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text)] disabled:opacity-35"
          >
            <Minus className="size-4" />
          </button>
          <span className="min-w-12 px-2 text-center text-sm font-bold tabular-nums">{line.quantity}</span>
          <button
            type="button"
            aria-label={`Increase ${line.itemNameSnapshot} quantity`}
            disabled={isDisabled}
            onClick={increase}
            className="grid size-9 place-items-center rounded-lg text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text)] disabled:opacity-35"
          >
            <Plus className="size-4" />
          </button>
        </div>

        <Button
          variant="ghost"
          aria-label={`Remove ${line.itemNameSnapshot}`}
          disabled={isDisabled}
          onClick={() => onRemove(line)}
          className="px-3"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <p className="mt-2 text-xs text-[var(--color-text-muted)]">
        Unit {formatMoney(line.effectiveUnitPrice, line.currency, locale)}
      </p>
    </article>
  );
}
