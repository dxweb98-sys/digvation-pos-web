import { PosAuthApiAdapter } from '@digvation/pos-auth';
import { assertApplicationEnabled, HttpRuntimeConfigAdapter } from '@digvation/pos-runtime';

import { BackofficeProviders } from '../providers/backoffice-providers';
import { backofficeRouter } from '../router/backoffice-router';

export async function bootstrapBackoffice() {
  const runtimePort = new HttpRuntimeConfigAdapter();
  const runtime = await runtimePort.load();
  const authPort = new PosAuthApiAdapter({
    baseUrl: runtime.apiBaseUrl,
    workspace: runtime.workspace,
  });

  assertApplicationEnabled(runtime, 'backoffice');

  const session = await authPort.restoreSession();

  return (
    <BackofficeProviders
      runtime={runtime}
      session={session}
      authPort={authPort}
      router={backofficeRouter}
    />
  );
}
