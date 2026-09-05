import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ToastProvider, useToast } from './toast';

afterEach(cleanup);

function ToastTrigger() {
  const { showToast } = useToast();
  return (
    <button
      type="button"
      onClick={() =>
        showToast({ title: 'Saved', description: 'The changes are ready.', variant: 'success' })
      }
    >
      Notify
    </button>
  );
}

describe('ToastProvider', () => {
  it('shows and dismisses app-scoped feedback', () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Notify' }));
    expect(screen.getByRole('status').textContent).toContain('Saved');
    expect(screen.getByRole('status').textContent).toContain('The changes are ready.');

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));
    expect(screen.queryByRole('status')).toBeNull();
  });
});
