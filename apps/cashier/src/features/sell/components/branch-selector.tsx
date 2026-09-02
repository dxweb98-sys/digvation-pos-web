import { MapPin } from 'lucide-react';

import type { SellingLocation } from '../cashier-transaction.types';

interface BranchSelectorProps {
  locations: readonly SellingLocation[];
  value: string;
  isLoading: boolean;
  onChange: (locationId: string) => void;
}

export function BranchSelector({ locations, value, isLoading, onChange }: BranchSelectorProps) {
  return (
    <div className="w-full max-w-sm">
      <label
        htmlFor="branch"
        className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-text-muted)]"
      >
        Branch
      </label>
      <div className="relative mt-2">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
        <select
          id="branch"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={isLoading || locations.length === 0}
          className="min-h-11 w-full appearance-none rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] pl-10 pr-4 text-sm font-semibold outline-none transition-shadow focus:ring-2 focus:ring-[var(--color-focus)]"
        >
          <option value="">Select Branch</option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
