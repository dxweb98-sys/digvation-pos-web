import { describe, expect, it } from 'vitest';

import { formatCurrencyInputValue, normalizeDecimalInput } from './input';

describe('shared decimal field helpers', () => {
  it('keeps a controlled decimal value as text and applies its scale', () => {
    expect(normalizeDecimalInput('00012,34567')).toBe('12.3456');
    expect(normalizeDecimalInput('12.3.4')).toBe('123.4');
    expect(normalizeDecimalInput('0008', { integer: true })).toBe('8');
  });

  it('formats only the presentation value of a money field', () => {
    expect(formatCurrencyInputValue('125000.5')).toBe('125.000,5');
    expect(formatCurrencyInputValue('1.234,50')).toBe('1.234,50');
    expect(formatCurrencyInputValue('')).toBe('');
  });
});
