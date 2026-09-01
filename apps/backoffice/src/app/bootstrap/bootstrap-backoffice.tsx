import { MockAuthAdapter } from '@digvation/pos-auth';
import { HttpRuntimeConfigAdapter } from '@digvation/pos-runtime';

import { BackofficeProviders } from '../providers/backoffice-providers';
import { backofficeRouter } from '../router/backoffice-router';

export async function bootstrapBackoffice() {
  const runtimePort = new HttpRuntimeConfigAdapter();
  const authPort = new MockAuthAdapter();
  const [runtime, session] = await Promise.all([runtimePort.load(), authPort.me()]);

  return (
    <BackofficeProviders
      runtime={runtime}
      session={session}
      authPort={authPort}
      router={backofficeRouter}
    />
  );
}
