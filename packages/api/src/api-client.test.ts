import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiClient } from './api-client';

function successResponse(data: unknown): Response {
  return new Response(
    JSON.stringify({
      success: true,
      data,
      request_id: 'api-client-test',
      timestamp: '2026-09-01T15:49:00.000Z',
    }),
    {
      status: 200,
      headers: { 'content-type': 'application/json' },
    },
  );
}

describe('ApiClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('preserves command headers while applying JSON transport headers', async () => {
    const fetchMock = vi.fn().mockResolvedValue(successResponse({ id: 'sale-1' }));
    vi.stubGlobal('fetch', fetchMock);

    const client = new ApiClient({ baseUrl: 'https://pos.example.test' });
    await client.post(
      '/api/v1/sales',
      { sellingLocationId: 'branch-1', currency: 'IDR' },
      { headers: { 'Idempotency-Key': 'cashier-create-sale-1' } },
    );

    expect(fetchMock).toHaveBeenCalledOnce();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(init.headers);

    expect(headers.get('idempotency-key')).toBe('cashier-create-sale-1');
    expect(headers.get('content-type')).toBe('application/json');
  });

  it('refreshes once and retries a request after an unauthorized response', async () => {
    const unauthorized = new Response(
      JSON.stringify({
        success: false,
        error: { code: 'AUTH_SESSION_EXPIRED', message: 'Authentication session has expired' },
        request_id: 'expired-session',
        timestamp: '2026-09-01T15:49:00.000Z',
      }),
      { status: 401, headers: { 'content-type': 'application/json' } },
    );
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(unauthorized)
      .mockResolvedValueOnce(successResponse({ id: 'sale-1' }));
    const getAccessToken = vi
      .fn()
      .mockResolvedValueOnce('expired-access')
      .mockResolvedValueOnce('fresh-access');
    const handleUnauthorized = vi.fn().mockResolvedValue(true);
    vi.stubGlobal('fetch', fetchMock);

    const client = new ApiClient({
      baseUrl: 'https://pos.example.test',
      getAccessToken,
      handleUnauthorized,
    });
    await expect(client.get('/api/v1/sales')).resolves.toEqual({ id: 'sale-1' });

    expect(handleUnauthorized).toHaveBeenCalledOnce();
    expect(handleUnauthorized).toHaveBeenCalledWith(false);
    const retryInit = fetchMock.mock.calls[1]?.[1];
    if (!retryInit) throw new Error('Expected retried request initialization.');
    expect(new Headers(retryInit.headers).get('authorization')).toBe('Bearer fresh-access');
  });

  it('notifies the authorizer when a refreshed request remains unauthorized', async () => {
    const unauthorizedResponse = () =>
      new Response(
        JSON.stringify({
          success: false,
          error: { code: 'AUTH_SESSION_EXPIRED', message: 'Authentication session has expired' },
          request_id: 'expired-session',
          timestamp: '2026-09-01T15:49:00.000Z',
        }),
        { status: 401, headers: { 'content-type': 'application/json' } },
      );
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(unauthorizedResponse())
      .mockResolvedValueOnce(unauthorizedResponse());
    const handleUnauthorized = vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    vi.stubGlobal('fetch', fetchMock);

    const client = new ApiClient({
      baseUrl: 'https://pos.example.test',
      getAccessToken: vi.fn().mockResolvedValue('access-token'),
      handleUnauthorized,
    });

    await expect(client.get('/api/v1/sales')).rejects.toMatchObject({
      status: 401,
      code: 'AUTH_SESSION_EXPIRED',
    });
    expect(handleUnauthorized).toHaveBeenNthCalledWith(1, false);
    expect(handleUnauthorized).toHaveBeenNthCalledWith(2, true);
  });
});
