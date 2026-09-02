import { Button } from '@digvation/pos-ui';

import type { ActionAvailability } from '../sale-workspace-view-model';

interface SaleFinalizePanelProps {
  availability: ActionAvailability;
  onFinalize: () => void;
}

export function SaleFinalizePanel({ availability, onFinalize }: SaleFinalizePanelProps) {
  return (
    <section className="border-t border-[var(--color-border)] p-5">
      <h3 className="text-sm font-bold">Finalize Sale</h3>
      <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
        The POS backend remains the authority for payment, fulfillment, assignment, contribution,
        and all finalization readiness checks.
      </p>
      <Button
        variant="secondary"
        className="mt-3 w-full"
        disabled={availability.state !== 'AVAILABLE'}
        onClick={onFinalize}
      >
        Finalize Sale
      </Button>
    </section>
  );
}
