import { PosAuthApiAdapter } from '@digvation/pos-auth';
import { assertApplicationEnabled, HttpRuntimeConfigAdapter } from '@digvation/pos-runtime';

import { CashierProviders } from '../providers/cashier-providers';
import { cashierRouter } from '../router/cashier-router';

export async function bootstrapCashier() {
  const runtimePort = new HttpRuntimeConfigAdapter();
  const runtime = await runtimePort.load();
  const authPort = new PosAuthApiAdapter({
    baseUrl: runtime.apiBaseUrl,
    workspace: runtime.workspace,
  });

  assertApplicationEnabled(runtime, 'cashier');

  const session = await authPort.restoreSession();

  return (
    <CashierProviders
      runtime={runtime}
      session={session}
      authPort={authPort}
      router={cashierRouter}
    />
  );
}
