import type { AuthPort, AuthSession } from './auth.types';

const DEVELOPMENT_SESSION: AuthSession = {
  identity: {
    userId: 'mock-user',
    displayName: 'Development User',
    workspace: 'local-development',
    permissions: ['auth:self'],
  },
};

export class MockAuthAdapter implements AuthPort {
  public async me(): Promise<AuthSession> {
    return structuredClone(DEVELOPMENT_SESSION);
  }

  public async logout(): Promise<void> {
    return Promise.resolve();
  }
}
