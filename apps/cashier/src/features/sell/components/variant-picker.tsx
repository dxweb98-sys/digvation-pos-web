import { Button } from '@digvation/pos-ui';
import { X } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 grid place-items-end bg-slate-950/20 p-0 backdrop-blur-[1px] sm:place-items-center sm:p-6">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="variant-picker-title"
        className="w-full rounded-t-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-2xl sm:max-w-lg sm:rounded-[var(--radius-panel)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
              Variant
            </p>
            <h2 id="variant-picker-title" className="mt-2 text-xl font-bold">
              {item.name}
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Choose the exact item variant. Pricing remains backend authoritative.
            </p>
          </div>
          <Button
            variant="ghost"
            aria-label="Close variant picker"
            onClick={onClose}
            className="px-3"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="mt-5 grid gap-2">
          <Button variant="secondary" className="justify-start" onClick={() => onSelect(null)}>
            Base item / no variant
          </Button>
          {variants.map((variant) => (
            <Button
              key={variant.id}
              variant="secondary"
              className="justify-start"
              onClick={() => onSelect(variant.id)}
            >
              {variant.name}
              <span className="ml-2 text-xs font-normal text-[var(--color-text-muted)]">
                {variant.code}
              </span>
            </Button>
          ))}
        </div>
      </section>
    </div>
  );
}
