import { useAuth } from '@digvation/pos-auth';
import { useRuntime } from '@digvation/pos-runtime';

import { getAppVersion } from '../../app/version/app-version';

export function AccountPage() {
  const { session } = useAuth();
  const runtime = useRuntime();
  const version = getAppVersion();

  if (!session) return null;

  return (
    <section className="px-5 py-6 lg:px-8 lg:py-8">
      <div className="max-w-3xl rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold">Account & runtime</h1>
        <p className="mt-4 text-sm leading-7 text-[var(--color-text-muted)]">
          {session.identity.displayName} · {runtime.workspace} · {runtime.deploymentProfile}
        </p>
        <p className="mt-2 text-xs text-[var(--color-text-muted)]">
          Version {version.version} · Build {version.revision}
        </p>
      </div>
    </section>
  );
}
