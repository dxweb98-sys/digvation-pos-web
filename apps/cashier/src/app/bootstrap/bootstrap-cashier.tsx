import { MockAuthAdapter } from '@digvation/pos-auth';
import { assertApplicationEnabled, HttpRuntimeConfigAdapter } from '@digvation/pos-runtime';

import { CashierProviders } from '../providers/cashier-providers';
import { cashierRouter } from '../router/cashier-router';

export async function bootstrapCashier() {
  const runtimePort = new HttpRuntimeConfigAdapter();
  const authPort = new MockAuthAdapter({ initiallyAuthenticated: false });
  const runtime = await runtimePort.load();

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
