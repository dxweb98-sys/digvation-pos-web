import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { BackofficeSession, LoginCredentials } from './auth-session';
import type { HttpAuthAdapter } from './http-auth-adapter';

type AuthenticationStatus = 'hydrating' | 'authenticated' | 'unauthenticated';

interface BackofficeAuthContextValue {
  status: AuthenticationStatus;
  session: BackofficeSession | null;
  login(input: LoginCredentials): Promise<void>;
  logout(): Promise<void>;
  getAccessToken(): Promise<string | null>;
}

const BackofficeAuthContext = createContext<BackofficeAuthContextValue | null>(null);

export function BackofficeAuthProvider({
  auth,
  children,
}: {
  auth: HttpAuthAdapter;
  children: ReactNode;
}) {
  const [status, setStatus] = useState<AuthenticationStatus>('hydrating');
  const [session, setSession] = useState<BackofficeSession | null>(null);

  useEffect(() => {
    let isMounted = true;
    void auth.restore().then(
      (restored) => {
        if (!isMounted) return;
        setSession(restored);
        setStatus(restored ? 'authenticated' : 'unauthenticated');
      },
      () => {
        if (!isMounted) return;
        setSession(null);
        setStatus('unauthenticated');
      },
    );
    return () => {
      isMounted = false;
    };
  }, [auth]);

  const login = useCallback(
    async (input: LoginCredentials) => {
      const authenticated = await auth.login(input);
      setSession(authenticated);
      setStatus('authenticated');
    },
    [auth],
  );

  const logout = useCallback(async () => {
    await auth.logout();
    setSession(null);
    setStatus('unauthenticated');
  }, [auth]);

  const getAccessToken = useCallback(() => auth.getAccessToken(), [auth]);

  const value = useMemo(
    () => ({ status, session, login, logout, getAccessToken }),
    [getAccessToken, login, logout, session, status],
  );
  return <BackofficeAuthContext.Provider value={value}>{children}</BackofficeAuthContext.Provider>;
}

export function useBackofficeAuth(): BackofficeAuthContextValue {
  const context = useContext(BackofficeAuthContext);
  if (!context) throw new Error('BackofficeAuthProvider is missing.');
  return context;
}
