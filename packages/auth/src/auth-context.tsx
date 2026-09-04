import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import type { AuthPort, AuthSession } from './auth.types';

const APPLICATION_HANDOFF_DURATION_MS = 480;

interface AuthContextValue {
  session: AuthSession | null;
  authPort: AuthPort;
  isEnteringApplication: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  session: AuthSession | null;
  authPort: AuthPort;
  children: ReactNode;
}

export function AuthProvider({ session, authPort, children }: AuthProviderProps) {
  const [currentSession, setCurrentSession] = useState(session);
  const [isEnteringApplication, setEnteringApplication] = useState(false);

  const login = useCallback(
    async (username: string, password: string) => {
      const nextSession = await authPort.login(username, password);
      setCurrentSession(nextSession);
      setEnteringApplication(true);
      window.setTimeout(() => setEnteringApplication(false), APPLICATION_HANDOFF_DURATION_MS);
    },
    [authPort],
  );
  const logout = useCallback(async () => {
    await authPort.logout();
    setCurrentSession(null);
    setEnteringApplication(false);
  }, [authPort]);
  const value = useMemo(
    () => ({ session: currentSession, authPort, isEnteringApplication, login, logout }),
    [authPort, currentSession, isEnteringApplication, login, logout],
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
