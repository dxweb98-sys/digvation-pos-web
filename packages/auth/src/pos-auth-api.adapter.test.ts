import { afterEach, describe, expect, it, vi } from 'vitest';

import { PosAuthApiAdapter } from './pos-auth-api.adapter';

class MemoryStorage implements Storage {
  private readonly entries = new Map<string, string>();

  public get length() {
    return this.entries.size;
  }

  public clear(): void {
    this.entries.clear();
  }

  public getItem(key: string): string | null {
    return this.entries.get(key) ?? null;
  }

  public key(index: number): string | null {
    return [...this.entries.keys()][index] ?? null;
  }

  public removeItem(key: string): void {
    this.entries.delete(key);
  }

  public setItem(key: string, value: string): void {
    this.entries.set(key, value);
  }
}

const storageKey = 'digvation.pos.auth.session.v1';
const futureExpiry = '2030-01-01T00:00:00.000Z';

function successResponse(data: unknown): Response {
  return new Response(JSON.stringify({ success: true, data }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

function authSession(overrides: Partial<Record<string, string>> = {}) {
  return {
    tokenType: 'Bearer' as const,
    accessToken: 'access-token',
    refreshToken: 'r'.repeat(64),
    accessExpiresAt: futureExpiry,
    refreshExpiresAt: futureExpiry,
    ...overrides,
  };
}

function currentUser() {
  return {
    id: 'user-1',
    displayName: 'Cashier One',
    roles: [
      { permissions: ['auth:self', 'sales:read'] },
      { permissions: ['sales:read', 'sales:write'] },
    ],
  };
}

describe('PosAuthApiAdapter', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('logs in, loads auth-me identity, and stores only the issued session credentials', async () => {
    const storage = new MemoryStorage();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(successResponse(authSession()))
      .mockResolvedValueOnce(successResponse(currentUser()));
    vi.stubGlobal('fetch', fetchMock);
    const adapter = new PosAuthApiAdapter({
      baseUrl: 'https://pos.example.test',
      workspace: 'nova-salon',
      storage,
    });

    const session = await adapter.login({
      workspace: 'nova-salon',
      identifier: 'cashier',
      password: 'correct-password',
    });

    expect(session.identity).toEqual({
      userId: 'user-1',
      displayName: 'Cashier One',
      workspace: 'nova-salon',
      permissions: ['auth:self', 'sales:read', 'sales:write'],
    });
    expect(JSON.parse(storage.getItem(storageKey)!)).toEqual(authSession());
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://pos.example.test/api/v1/auth/login');
    expect(fetchMock.mock.calls[1]?.[0]).toBe('https://pos.example.test/api/v1/auth/me');
    const meInit = fetchMock.mock.calls[1]?.[1];
    if (!meInit) throw new Error('Expected auth-me request initialization.');
    expect(new Headers(meInit.headers).get('authorization')).toBe('Bearer access-token');
  });

  it('rotates an expired access credential before restoring the current user', async () => {
    const storage = new MemoryStorage();
    storage.setItem(
      storageKey,
      JSON.stringify(authSession({ accessExpiresAt: '2020-01-01T00:00:00.000Z' })),
    );
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(successResponse(authSession({ accessToken: 'rotated-access' })))
      .mockResolvedValueOnce(successResponse(currentUser()));
    vi.stubGlobal('fetch', fetchMock);
    const adapter = new PosAuthApiAdapter({
      baseUrl: 'https://pos.example.test',
      workspace: 'nova-salon',
      storage,
    });

    const session = await adapter.restoreSession();

    expect(session?.identity.displayName).toBe('Cashier One');
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://pos.example.test/api/v1/auth/refresh');
    const refreshInit = fetchMock.mock.calls[0]?.[1];
    if (!refreshInit || typeof refreshInit.body !== 'string') {
      throw new Error('Expected refresh request body.');
    }
    expect(JSON.parse(refreshInit.body)).toEqual({ refreshToken: 'r'.repeat(64) });
    const meInit = fetchMock.mock.calls[1]?.[1];
    if (!meInit) throw new Error('Expected auth-me request initialization.');
    expect(new Headers(meInit.headers).get('authorization')).toBe('Bearer rotated-access');
  });
});
