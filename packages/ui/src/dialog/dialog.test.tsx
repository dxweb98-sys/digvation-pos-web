import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Dialog } from './dialog';

afterEach(cleanup);

describe('Dialog', () => {
  it('contains focus and restores it after close', () => {
    const onClose = vi.fn();
    const { rerender } = render(<button type="button">Open dialog</button>);

    const opener = screen.getByRole('button', { name: 'Open dialog' });
    opener.focus();

    rerender(
      <>
        <button type="button">Open dialog</button>
        <Dialog open onClose={onClose} ariaLabel="Example dialog">
          <button type="button">First action</button>
          <button type="button">Last action</button>
        </Dialog>
      </>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Example dialog' });
    expect(document.activeElement).toBe(dialog);

    const lastAction = screen.getByRole('button', { name: 'Last action' });
    lastAction.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'First action' }));

    rerender(
      <>
        <button type="button">Open dialog</button>
        <Dialog open={false} onClose={onClose} ariaLabel="Example dialog">
          <button type="button">First action</button>
        </Dialog>
      </>,
    );

    expect(document.activeElement).toBe(opener);
  });

  it('only dismisses through enabled dismissal options', () => {
    const onClose = vi.fn();
    render(
      <Dialog open onClose={onClose} ariaLabel="Dismissible dialog" closeOnEscape closeOnOverlay>
        <button type="button">Action</button>
      </Dialog>,
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.mouseDown(screen.getByRole('dialog').parentElement as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
