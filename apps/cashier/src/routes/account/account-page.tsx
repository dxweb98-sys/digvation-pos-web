import { useAuth } from '@digvation/pos-auth';
import { useRuntime } from '@digvation/pos-runtime';

import { getAppVersion } from '../../app/version/app-version';

export function AccountPage() {
  const { session } = useAuth();
  const runtime = useRuntime();
  const version = getAppVersion();

  if (!session) return null;

  return (
    <section className="h-full min-h-0 overflow-y-auto px-4 py-4 lg:px-6 lg:py-5">
      <div className="mx-auto max-w-[1800px]">
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-panel)]">
          <h1 className="text-xl font-bold tracking-[-0.03em]">Account & diagnostics</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Current workspace and application details.
          </p>
        </div>

        <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[
            ['User', session.identity.displayName],
            ['Workspace', runtime.workspace],
            ['Deployment', runtime.deploymentProfile],
            ['Branding', runtime.branding.mode],
            ['Version', version.version],
            ['Build', version.revision],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-panel)]"
            >
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                {label}
              </dt>
              <dd className="mt-2 break-all text-sm font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
