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
});
