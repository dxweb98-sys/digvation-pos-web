import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { AuthPort, AuthSession, LoginCredentials } from './auth.types';

interface AuthContextValue {
  session: AuthSession | null;
  authPort: AuthPort;
  login(credentials: LoginCredentials): Promise<void>;
  logout(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  session: AuthSession | null;
  authPort: AuthPort;
  children: ReactNode;
}

export function AuthProvider({ session: initialSession, authPort, children }: AuthProviderProps) {
  const [session, setSession] = useState(initialSession);

  useEffect(() => authPort.subscribeSession(setSession), [authPort]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      authPort,
      login: async (credentials) => {
        setSession(await authPort.login(credentials));
      },
      logout: async () => {
        await authPort.logout();
        setSession(null);
      },
    }),
    [authPort, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('AuthProvider is missing.');
  }

  return context;
}

export function useAuthenticatedAuth(): AuthContextValue & { session: AuthSession } {
  const context = useAuth();
  if (!context.session) throw new Error('An authenticated session is required.');

  return { ...context, session: context.session };
}
