import { MockAuthAdapter } from '@digvation/pos-auth';
import { HttpRuntimeConfigAdapter } from '@digvation/pos-runtime';

import { CashierProviders } from '../providers/cashier-providers';
import { cashierRouter } from '../router/cashier-router';

export async function bootstrapCashier() {
  const runtimePort = new HttpRuntimeConfigAdapter();
  const authPort = new MockAuthAdapter();

  const [runtime, session] = await Promise.all([runtimePort.load(), authPort.me()]);

  return (
    <CashierProviders runtime={runtime} session={session} authPort={authPort} router={cashierRouter} />
  );
}
