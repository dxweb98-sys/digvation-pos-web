import { createContext, useContext, type ReactNode } from 'react';

import type { AuthPort, AuthSession } from './auth.types';

interface AuthContextValue {
  session: AuthSession;
  authPort: AuthPort;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps extends AuthContextValue {
  children: ReactNode;
}

export function AuthProvider({ session, authPort, children }: AuthProviderProps) {
  return (
    <AuthContext.Provider value={{ session, authPort }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('AuthProvider is missing.');
  }

  return context;
}
