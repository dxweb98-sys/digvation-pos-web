import { Button } from '@digvation/pos-ui';
import { useState } from 'react';

import type { Employee, SaleLine } from '../cashier-transaction.types';
import type { ActionAvailability } from '../sale-workspace-view-model';

interface SaleLineTeamPanelProps {
  line: SaleLine;
  employees: Employee[];
  availability: ActionAvailability;
  onSave: (
    line: SaleLine,
    employeeIds: string[],
    contributors: Array<{ employeeId: string; shareRate?: string }>,
  ) => void;
}

export function SaleLineTeamPanel({
  line,
  employees,
  availability,
  onSave,
}: SaleLineTeamPanelProps) {
  const configured = line.participations.filter(
    (entry) => entry.assigned || entry.shareRate !== null,
  );
  const [selectedIds, setSelectedIds] = useState(() => configured.map((entry) => entry.employeeId));
  const [shares, setShares] = useState(() =>
    Object.fromEntries(configured.map((entry) => [entry.employeeId, entry.shareRate ?? ''])),
  );
  const supportsTeam =
    line.employeeAssignmentModeSnapshot !== null || line.allowEmployeeContributionSnapshot;

  if (!supportsTeam) return null;

  const disabled = availability.state !== 'AVAILABLE';
  const toggleEmployee = (employeeId: string) => {
    setSelectedIds((current) =>
      current.includes(employeeId)
        ? current.filter((id) => id !== employeeId)
        : [...current, employeeId],
    );
  };

  return (
    <details className="mt-3 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3">
      <summary className="cursor-pointer text-xs font-bold">Team & contribution</summary>
      <p className="mt-2 text-xs leading-5 text-[var(--color-text-muted)]">
        Leave every share blank for the backend’s equal allocation. Enter a decimal fraction only
        when assigning an explicit share.
      </p>
      <div className="mt-3 grid gap-2">
        {employees.map((employee) => {
          const selected = selectedIds.includes(employee.id);
          return (
            <label key={employee.id} className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={selected}
                disabled={disabled}
                onChange={() => toggleEmployee(employee.id)}
              />
              <span className="min-w-0 flex-1 truncate">{employee.displayName}</span>
              {line.allowEmployeeContributionSnapshot && selected ? (
                <input
                  aria-label={`${employee.displayName} contribution share`}
                  value={shares[employee.id] ?? ''}
                  onChange={(event) =>
                    setShares((current) => ({ ...current, [employee.id]: event.target.value }))
                  }
                  disabled={disabled}
                  inputMode="decimal"
                  placeholder="Equal"
                  className="min-h-8 w-20 rounded border border-[var(--color-border)] bg-white px-2 text-right"
                />
              ) : null}
            </label>
          );
        })}
      </div>
      <Button
        variant="secondary"
        className="mt-3 w-full"
        disabled={disabled}
        onClick={() =>
          onSave(
            line,
            selectedIds,
            selectedIds.map((employeeId) => {
              const shareRate = shares[employeeId]?.trim();
              return shareRate ? { employeeId, shareRate } : { employeeId };
            }),
          )
        }
      >
        Save team
      </Button>
    </details>
  );
}
