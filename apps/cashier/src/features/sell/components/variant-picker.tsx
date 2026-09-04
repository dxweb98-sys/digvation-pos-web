import { Dialog } from '@digvation/pos-ui';
import { Check, ChevronRight, X } from 'lucide-react';

import type { CatalogItem, CatalogVariant } from '../cashier-transaction.types';

export interface VariantPickerState {
  item: CatalogItem;
  variants: readonly CatalogVariant[];
}

interface VariantPickerProps extends VariantPickerState {
  onSelect: (catalogVariantId: string | null) => void;
  onClose: () => void;
}

export function VariantPicker({ item, variants, onSelect, onClose }: VariantPickerProps) {
  return (
    <Dialog
      open
      onClose={onClose}
      ariaLabelledBy="variant-picker-title"
      closeOnEscape
      closeOnOverlay
      overlayClassName="grid place-items-end bg-slate-950/25 backdrop-blur-[2px] sm:place-items-center sm:p-6"
      className="animate-[pos-dialog-in_170ms_ease-out] w-full rounded-t-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-2xl sm:max-w-md sm:rounded-3xl"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-brand)]">
            Choose option
          </p>
          <h2 id="variant-picker-title" className="mt-1 text-lg font-bold">
            {item.name}
          </h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Select one option to add it to the cart.
          </p>
        </div>
        <button
          type="button"
          aria-label="Close variant picker"
          onClick={onClose}
          className="grid size-9 place-items-center rounded-xl text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-muted)]"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="mt-4 grid gap-1.5">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="group flex min-h-12 items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 text-left transition-all hover:border-[var(--color-brand)]/35 hover:bg-[var(--color-brand)]/5"
        >
          <span>
            <span className="block text-sm font-semibold">Standard</span>
            <span className="mt-0.5 block text-xs text-[var(--color-text-muted)]">
              Default item option
            </span>
          </span>
          <ChevronRight className="size-4 text-[var(--color-text-muted)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--color-brand)]" />
        </button>
        {variants.map((variant) => (
          <button
            key={variant.id}
            type="button"
            onClick={() => onSelect(variant.id)}
            className="group flex min-h-12 items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 text-left transition-all hover:border-[var(--color-brand)]/35 hover:bg-[var(--color-brand)]/5"
          >
            <span className="flex items-center gap-3">
              <span className="grid size-8 place-items-center rounded-xl bg-[var(--color-brand)]/10 text-[var(--color-brand)]">
                <Check className="size-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold">{variant.name}</span>
                <span className="mt-0.5 block font-mono text-[10px] text-[var(--color-text-muted)]">
                  {variant.code}
                </span>
              </span>
            </span>
            <ChevronRight className="size-4 text-[var(--color-text-muted)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--color-brand)]" />
          </button>
        ))}
      </div>
    </Dialog>
  );
}
