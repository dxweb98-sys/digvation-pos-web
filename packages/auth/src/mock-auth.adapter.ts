import type { AuthPort, AuthSession } from './auth.types';

const DEVELOPMENT_SESSION: AuthSession = {
  identity: {
    userId: 'mock-user',
    displayName: 'Development User',
    workspace: 'local-development',
    permissions: ['auth:self'],
  },
};

const MOCK_AUTH_STATE_KEY = 'digvation-pos.mock-auth-state';

function readMockSessionState(): 'SIGNED_IN' | 'SIGNED_OUT' {
  if (typeof window === 'undefined') return 'SIGNED_OUT';
  return window.localStorage.getItem(MOCK_AUTH_STATE_KEY) === 'SIGNED_IN'
    ? 'SIGNED_IN'
    : 'SIGNED_OUT';
}

function writeMockSessionState(state: 'SIGNED_IN' | 'SIGNED_OUT') {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(MOCK_AUTH_STATE_KEY, state);
  }
}

export class MockAuthAdapter implements AuthPort {
  public async me(): Promise<AuthSession | null> {
    return readMockSessionState() === 'SIGNED_OUT' ? null : structuredClone(DEVELOPMENT_SESSION);
  }

  public async login(username: string, password: string): Promise<AuthSession> {
    if (username.trim() === '' || password === '') {
      throw new Error('Username and password are required.');
    }

    writeMockSessionState('SIGNED_IN');
    return structuredClone(DEVELOPMENT_SESSION);
  }

  public async logout(): Promise<void> {
    writeMockSessionState('SIGNED_OUT');
  }
}
