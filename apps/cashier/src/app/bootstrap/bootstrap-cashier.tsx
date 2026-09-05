import { HttpAuthAdapter, MockAuthAdapter } from '@digvation/pos-auth';
import { assertApplicationEnabled, HttpRuntimeConfigAdapter } from '@digvation/pos-runtime';

import { CashierProviders } from '../providers/cashier-providers';
import { cashierRouter } from '../router/cashier-router';

export async function bootstrapCashier() {
  const runtimePort = new HttpRuntimeConfigAdapter();
  const runtime = await runtimePort.load();
  const authPort =
    import.meta.env.DEV && import.meta.env.VITE_CASHIER_DEMO !== 'false'
      ? new MockAuthAdapter({ initiallyAuthenticated: false })
      : new HttpAuthAdapter(runtime.apiBaseUrl, runtime.workspace);

  assertApplicationEnabled(runtime, 'cashier');

  const session = await authPort.me();

  return (
    <CashierProviders
      runtime={runtime}
      session={session}
      authPort={authPort}
      router={cashierRouter}
    />
  );
}
