import { useState, type FormEvent, type ReactNode } from 'react';

import { PosAuthApiError } from './pos-auth-api.adapter';
import { useAuth } from './auth-context';

interface AuthGateProps {
  applicationName: string;
  workspace: string;
  children: ReactNode;
}

export function AuthGate({ applicationName, workspace, children }: AuthGateProps) {
  const { session, login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (session) return children;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({ workspace, identifier, password });
    } catch (cause) {
      setError(
        cause instanceof PosAuthApiError ? cause.message : 'Sign in could not be completed.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--color-background)] p-6">
      <section className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
          {applicationName}
        </p>
        <h1 className="mt-3 text-2xl font-bold">Sign in</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
          Sign in to the configured workspace: <strong>{workspace}</strong>
        </p>

        <form className="mt-6 grid gap-4" onSubmit={submit}>
          <label className="grid gap-2 text-sm font-semibold">
            Username or phone number
            <input
              required
              minLength={3}
              maxLength={64}
              autoComplete="username"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              className="min-h-11 rounded-[var(--radius-control)] border border-[var(--color-border)] px-3 font-normal"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Password
            <input
              required
              minLength={10}
              maxLength={128}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="min-h-11 rounded-[var(--radius-control)] border border-[var(--color-border)] px-3 font-normal"
            />
          </label>
          {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="min-h-11 rounded-[var(--radius-control)] bg-[var(--color-text)] px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  );
}
