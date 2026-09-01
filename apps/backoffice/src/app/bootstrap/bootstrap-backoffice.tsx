import { MockAuthAdapter } from '@digvation/pos-auth';
import { assertApplicationEnabled, HttpRuntimeConfigAdapter } from '@digvation/pos-runtime';

import { BackofficeProviders } from '../providers/backoffice-providers';
import { backofficeRouter } from '../router/backoffice-router';

export async function bootstrapBackoffice() {
  const runtimePort = new HttpRuntimeConfigAdapter();
  const authPort = new MockAuthAdapter();
  const runtime = await runtimePort.load();

  assertApplicationEnabled(runtime, 'backoffice');

  const session = await authPort.me();

  return (
    <BackofficeProviders
      runtime={runtime}
      session={session}
      authPort={authPort}
      router={backofficeRouter}
    />
  );
}
