import { Button } from '@digvation/pos-ui';
import { useState } from 'react';

import type { SaleLine } from '../cashier-transaction.types';
import type { ActionAvailability } from '../sale-workspace-view-model';

const transitionStatuses = ['IN_PROGRESS', 'COMPLETED', 'CANCELED'] as const;

type TransitionStatus = (typeof transitionStatuses)[number];

function isTransitionStatus(value: string): value is TransitionStatus {
  return transitionStatuses.some((status) => status === value);
}

interface SaleLineFulfillmentPanelProps {
  line: SaleLine;
  availability: ActionAvailability;
  onTransition: (line: SaleLine, status: TransitionStatus) => void;
}

export function SaleLineFulfillmentPanel({
  line,
  availability,
  onTransition,
}: SaleLineFulfillmentPanelProps) {
  const fulfillment = line.fulfillment;
  const [nextStatus, setNextStatus] = useState<TransitionStatus>('IN_PROGRESS');

  if (!fulfillment) return null;

  const disabled = availability.state !== 'AVAILABLE';

  return (
    <div className="mt-3 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-bold">Fulfillment</p>
        <span className="text-xs font-semibold text-[var(--color-text-muted)]">
          {fulfillment.status.replace('_', ' ')}
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-[var(--color-text-muted)]">
        This line is backend-tracked. The POS backend validates every requested transition.
      </p>
      <div className="mt-3 flex gap-2">
        <select
          aria-label={`${line.itemNameSnapshot} fulfillment transition`}
          value={nextStatus}
          disabled={disabled}
          onChange={(event) => {
            if (isTransitionStatus(event.target.value)) setNextStatus(event.target.value);
          }}
          className="min-h-9 min-w-0 flex-1 rounded border border-[var(--color-border)] bg-white px-2 text-xs"
        >
          <option value="IN_PROGRESS">In progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELED">Canceled</option>
        </select>
        <Button
          variant="secondary"
          disabled={disabled}
          onClick={() => onTransition(line, nextStatus)}
        >
          Update
        </Button>
      </div>
    </div>
  );
}
