import type { AuthPort, AuthRequestAuthorizer, AuthSession, LoginCredentials } from './auth.types';

const DEVELOPMENT_SESSION: AuthSession = {
  identity: {
    userId: 'mock-user',
    displayName: 'Development User',
    workspace: 'local-development',
    permissions: ['auth:self'],
  },
};

export class MockAuthAdapter implements AuthPort {
  public readonly requestAuthorizer: AuthRequestAuthorizer = {
    getAccessToken: async () => null,
    handleUnauthorized: async (retryExhausted) => {
      void retryExhausted;
      return false;
    },
  };

  public async login(credentials: LoginCredentials): Promise<AuthSession> {
    void credentials;
    return structuredClone(DEVELOPMENT_SESSION);
  }

  public async restoreSession(): Promise<AuthSession> {
    return structuredClone(DEVELOPMENT_SESSION);
  }

  public async me(): Promise<AuthSession> {
    return structuredClone(DEVELOPMENT_SESSION);
  }

  public async logout(): Promise<void> {
    return Promise.resolve();
  }

  public subscribeSession(listener: (session: AuthSession | null) => void): () => void {
    void listener;
    return () => undefined;
  }
}
