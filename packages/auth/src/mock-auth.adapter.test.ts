import { describe, expect, it } from 'vitest';

import { MockAuthAdapter } from './mock-auth.adapter';

describe('MockAuthAdapter', () => {
  it('provides development identity without exposing token mechanics', async () => {
    window.localStorage.setItem('digvation-pos.mock-auth-state', 'SIGNED_IN');
    const adapter = new MockAuthAdapter();
    const session = await adapter.me();

    if (!session) throw new Error('Mock development session should be available by default.');

    expect(session.identity.displayName).toBe('Development User');
    expect(session.identity.permissions).toContain('auth:self');
    window.localStorage.removeItem('digvation-pos.mock-auth-state');
  });

  it('keeps the mock session signed out until a new mock login succeeds', async () => {
    window.localStorage.removeItem('digvation-pos.mock-auth-state');
    const adapter = new MockAuthAdapter();

    await adapter.logout();
    await expect(adapter.me()).resolves.toBeNull();

    await adapter.login('reviewer', 'review-password');
    await expect(adapter.me()).resolves.toMatchObject({
      identity: { displayName: 'Development User' },
    });
    window.localStorage.removeItem('digvation-pos.mock-auth-state');
  });

  it('treats a browser with no stored session as unauthenticated', async () => {
    window.localStorage.removeItem('digvation-pos.mock-auth-state');
    const adapter = new MockAuthAdapter();

    await expect(adapter.me()).resolves.toBeNull();
  });
});
