import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { Select } from './select';

describe('canonical select interactions', () => {
  it('opens the reference-style custom panel and updates a controlled value', () => {
    function ControlledSelect() {
      const [value, setValue] = useState('CASH');
      return (
        <Select aria-label="Payment method" value={value} onValueChange={setValue}>
          <option value="CASH">Cash</option>
          <option value="QRIS">QRIS</option>
        </Select>
      );
    }

    render(<ControlledSelect />);
    const trigger = screen.getByRole('button', { name: 'Payment method' });
    fireEvent.click(trigger);
    expect(screen.getByRole('listbox')).toBeTruthy();
    expect(screen.queryByRole('combobox')).toBeNull();
    fireEvent.click(screen.getByRole('option', { name: 'QRIS' }));
    expect(trigger.textContent).toContain('QRIS');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('supports trigger keyboard navigation and selection', () => {
    function ControlledSelect() {
      const [value, setValue] = useState('CASH');
      return (
        <Select aria-label="Discount type" value={value} onValueChange={setValue}>
          <option value="CASH">Cash</option>
          <option value="QRIS">QRIS</option>
        </Select>
      );
    }

    render(<ControlledSelect />);
    const trigger = screen.getByRole('button', { name: 'Discount type' });
    trigger.focus();
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    expect(screen.getByRole('listbox')).toBeTruthy();
    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(trigger.textContent).toContain('QRIS');
  });
});
