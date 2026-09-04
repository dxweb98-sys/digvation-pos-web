import React from 'react';
import ReactDOM from 'react-dom/client';

import '@digvation/pos-ui/styles.css';

import { AppBootScreen } from './app/bootstrap/app-boot-screen';
import { BootstrapTransition } from './app/bootstrap/bootstrap-transition';
import { bootstrapCashier } from './app/bootstrap/bootstrap-cashier';

const BOOT_SPLASH_MINIMUM_DURATION_MS = 560;

function renderBootstrapFailure(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown startup error';

  root.render(
    <React.StrictMode>
      <main className="grid min-h-screen place-items-center p-6">
        <section className="max-w-lg rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-danger)]">
            Startup blocked
          </p>
          <h1 className="mt-3 text-xl font-bold">Cashier could not initialize.</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">{message}</p>
        </section>
      </main>
    </React.StrictMode>,
  );
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
const bootStartedAt = performance.now();

root.render(
  <React.StrictMode>
    <AppBootScreen />
  </React.StrictMode>,
);

void bootstrapCashier()
  .then((app) => {
    const remainingDuration = Math.max(
      0,
      BOOT_SPLASH_MINIMUM_DURATION_MS - (performance.now() - bootStartedAt),
    );
    window.setTimeout(() => {
      root.render(
        <React.StrictMode>
          <BootstrapTransition>{app}</BootstrapTransition>
        </React.StrictMode>,
      );
    }, remainingDuration);
  })
  .catch(renderBootstrapFailure);
