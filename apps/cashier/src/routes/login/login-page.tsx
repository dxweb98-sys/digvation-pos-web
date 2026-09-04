import { useAuth } from '@digvation/pos-auth';
import { useRuntime } from '@digvation/pos-runtime';
import { Button, Input } from '@digvation/pos-ui';
import { CheckCircle2, Eye, EyeOff, LoaderCircle, ReceiptText, ShieldCheck } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router';

const WORKSPACE_REASSURANCE = [
  { label: 'Secure workspace access', icon: ShieldCheck },
  { label: 'Transaction context stays visible', icon: CheckCircle2 },
] as const;

export function LoginPage() {
  const { session, login } = useAuth();
  const runtime = useRuntime();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [isLeaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!session || !isLeaving) return;

    const handoff = window.setTimeout(() => navigate('/sell', { replace: true }), 120);
    return () => window.clearTimeout(handoff);
  }, [isLeaving, navigate, session]);

  if (session && !isLeaving && !isSubmitting) return <Navigate to="/sell" replace />;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (username.trim() === '' || password === '') {
      setError('Enter both username and password.');
      return;
    }

    setSubmitting(true);
    try {
      await login(username, password);
      setLeaving(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  const isTransitioning = isSubmitting || isLeaving;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--color-background)]">
      <div className="pointer-events-none absolute -left-24 top-16 size-80 rounded-full bg-[var(--color-brand)]/[0.035] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 right-[20%] size-72 rounded-full bg-[var(--color-accent-lavender)]/25 blur-3xl" />

      <div
        className={`relative mx-auto grid min-h-screen max-w-7xl transition-[opacity,transform] duration-150 ease-out lg:grid-cols-[minmax(0,1fr)_460px] ${
          isLeaving ? 'translate-y-1 scale-[0.995] opacity-0' : 'opacity-100'
        }`}
      >
        <section className="hidden min-h-full flex-col justify-between border-r border-[var(--color-border)]/70 px-10 py-10 lg:flex xl:px-16">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-xl bg-[var(--color-brand)] text-white shadow-lg shadow-[var(--color-brand)]/20">
                <ReceiptText className="size-5" />
              </div>
              <div>
                <p className="text-base font-bold tracking-[-0.03em]">
                  {runtime.branding.productName}
                </p>
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{runtime.workspace}</p>
              </div>
            </div>

            <div className="mt-24 max-w-lg">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-brand)]">
                Cashier workspace
              </p>
              <h1 className="mt-4 text-4xl font-bold leading-[1.12] tracking-[-0.055em]">
                Ready for the next transaction.
              </h1>
              <p className="mt-5 max-w-md text-sm leading-6 text-[var(--color-text-muted)]">
                Sign in to access the selling workspace and keep every transaction in its approved
                operational context.
              </p>
            </div>
          </div>

          <div className="grid gap-3">
            {WORKSPACE_REASSURANCE.map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)]/80 bg-[var(--color-surface)]/70 px-4 py-3"
              >
                <span className="grid size-8 place-items-center rounded-lg bg-[var(--color-brand)]/10 text-[var(--color-brand)]">
                  <Icon className="size-4" />
                </span>
                <p className="text-sm font-semibold">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex min-h-screen items-center px-4 py-8 sm:px-8 lg:px-10">
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-8 lg:hidden">
              <div className="grid size-12 place-items-center rounded-xl bg-[var(--color-brand)] text-white shadow-lg shadow-[var(--color-brand)]/20">
                <ReceiptText className="size-5" />
              </div>
              <h1 className="mt-4 text-2xl font-bold tracking-[-0.04em]">
                {runtime.branding.productName}
              </h1>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                Sign in to continue to Cashier
              </p>
            </div>

            <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-panel)] sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-brand)]">
                Secure sign in
              </p>
              <h2 className="mt-3 text-2xl font-bold tracking-[-0.04em]">Welcome back</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                Use your Cashier account to open the workspace.
              </p>

              {error ? (
                <div
                  className="mt-5 rounded-[var(--radius-control)] border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/10 px-3 py-2.5 text-sm text-[var(--color-danger)]"
                  role="alert"
                >
                  {error}
                </div>
              ) : null}

              <form className="mt-6 space-y-4" onSubmit={submit} noValidate>
                <label htmlFor="login-username" className="block text-sm font-medium">
                  Username or email
                  <Input
                    id="login-username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    disabled={isTransitioning}
                    autoComplete="username"
                    className="mt-1.5"
                  />
                </label>
                <div>
                  <label htmlFor="login-password" className="block text-sm font-medium">
                    Password
                  </label>
                  <span className="relative mt-1.5 block">
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      disabled={isTransitioning}
                      autoComplete="current-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword((current) => !current)}
                      disabled={isTransitioning}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]/30 disabled:opacity-50"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </span>
                </div>
                <Button type="submit" fullWidth disabled={isTransitioning} className="mt-2">
                  {isTransitioning ? <LoaderCircle className="size-4 animate-spin" /> : null}
                  {isLeaving
                    ? 'Opening workspace...'
                    : isSubmitting
                      ? 'Authenticating...'
                      : 'Sign in to Cashier'}
                </Button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
