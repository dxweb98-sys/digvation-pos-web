import { fireEvent, render, screen } from '@testing-library/react';
import { useEffect, useState } from 'react';
import { describe, expect, it } from 'vitest';

import { CurrencyInput, DecimalInput, Input } from './input';

function assertContinuousTyping(
  input: HTMLInputElement,
  values: readonly string[],
  expectedValue: string,
  mounts: () => number,
  unmounts: () => number,
) {
  const mountedInput = input;
  input.focus();
  values.forEach((value) => {
    fireEvent.change(input, { target: { value } });
    expect(mountedInput.isConnected).toBe(true);
    expect(document.activeElement).toBe(mountedInput);
  });
  expect(mountedInput.value).toBe(expectedValue);
  expect(mounts()).toBe(1);
  expect(unmounts()).toBe(0);
}

describe('canonical input interactions', () => {
  it('keeps a controlled text input mounted, focused, and updated through multiple characters', () => {
    let mountCount = 0;
    let unmountCount = 0;
    function ControlledTextInput() {
      const [value, setValue] = useState('');
      useEffect(() => {
        mountCount += 1;
        return () => {
          unmountCount += 1;
        };
      }, []);
      return (
        <Input
          aria-label="Customer name"
          clearable
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      );
    }

    render(<ControlledTextInput />);
    assertContinuousTyping(
      screen.getByRole('textbox', { name: 'Customer name' }),
      ['A', 'Al', 'Aly', 'Alya'],
      'Alya',
      () => mountCount,
      () => unmountCount,
    );
  });

  it('keeps a controlled numeric input mounted and focused while normalizing typed text', () => {
    let mountCount = 0;
    let unmountCount = 0;
    function ControlledNumericInput() {
      const [value, setValue] = useState('');
      useEffect(() => {
        mountCount += 1;
        return () => {
          unmountCount += 1;
        };
      }, []);
      return <DecimalInput aria-label="Quantity" integer value={value} onValueChange={setValue} />;
    }

    render(<ControlledNumericInput />);
    assertContinuousTyping(
      screen.getByRole('textbox', { name: 'Quantity' }),
      ['0', '01', '012'],
      '12',
      () => mountCount,
      () => unmountCount,
    );
  });

  it('keeps a controlled currency input mounted and focused while its canonical money text updates', () => {
    let mountCount = 0;
    let unmountCount = 0;
    function ControlledCurrencyInput() {
      const [value, setValue] = useState('');
      useEffect(() => {
        mountCount += 1;
        return () => {
          unmountCount += 1;
        };
      }, []);
      return <CurrencyInput aria-label="Cash tendered" value={value} onValueChange={setValue} />;
    }

    render(<ControlledCurrencyInput />);
    assertContinuousTyping(
      screen.getByRole('textbox', { name: 'Cash tendered' }),
      ['1', '12', '123', '1234'],
      '1234',
      () => mountCount,
      () => unmountCount,
    );
  });
});
