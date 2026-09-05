import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { Combobox } from './combobox';
import { Input } from './input';
import { Select } from './select';
import { DataTable, getPaginationPages } from './data-table';

afterEach(cleanup);

describe('shared field controls', () => {
  it('keeps a controlled input mounted and focused as clear affordance appears', () => {
    function ControlledInput() {
      const [value, setValue] = useState('');
      return (
        <Input
          aria-label="Name"
          value={value}
          clearable
          onClear={() => setValue('')}
          onNativeChange={(event) => setValue(event.target.value)}
        />
      );
    }

    render(<ControlledInput />);
    const input = screen.getByRole('textbox', { name: 'Name' });
    input.focus();
    fireEvent.change(input, { target: { value: 'Alya' } });
    expect(document.activeElement).toBe(input);
    expect((input as HTMLInputElement).value).toBe('Alya');
  });

  it('uses a custom select panel and reports the selected controlled value', () => {
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
    trigger.focus();
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    expect(screen.getByRole('listbox')).toBeTruthy();
    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(trigger.textContent).toContain('QRIS');
  });

  it('filters and selects a combobox option without losing text focus', () => {
    function ControlledCombobox() {
      const [value, setValue] = useState('');
      return (
        <Combobox
          ariaLabel="Employee"
          value={value}
          onChange={setValue}
          options={[
            { value: 'ari', label: 'Ari' },
            { value: 'bima', label: 'Bima' },
          ]}
        />
      );
    }

    render(<ControlledCombobox />);
    const input = screen.getByRole('textbox', { name: 'Employee' });
    input.focus();
    fireEvent.change(input, { target: { value: 'bim' } });
    expect(document.activeElement).toBe(input);
    fireEvent.click(screen.getByRole('option', { name: 'Bima' }));
    expect((input as HTMLInputElement).value).toBe('Bima');
  });

  it('renders table pagination and reports generic page changes', () => {
    const pages: number[] = [];
    render(
      <DataTable
        columns={[{ key: 'name', label: 'Name', render: (row: { name: string }) => row.name }]}
        data={[{ name: 'Alya' }]}
        rowKey={(row) => row.name}
        pagination={{ page: 2, pageSize: 10, total: 60 }}
        onPageChange={(page) => pages.push(page)}
      />,
    );
    expect(screen.getByText('Alya')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(pages).toEqual([3]);
    expect(getPaginationPages(6, 10)).toEqual([4, 5, 6, 7, 8]);
  });
});
