import { ApiClient, ApiError } from '@digvation/pos-api';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { HttpCashierTransactionAdapter } from './cashier-transaction.adapter';
import type {
  ApiPage,
  CatalogCategory,
  CatalogItem,
  CatalogVariant,
  ResolvedPrice,
  Sale,
  SellingLocation,
} from './cashier-transaction.types';

const baseUrl = 'https://pos.example.test';
const accessToken = 'pos-access-token';
const locationId = '11111111-1111-4111-8111-111111111111';
const categoryId = '22222222-2222-4222-8222-222222222222';
const itemId = '33333333-3333-4333-8333-333333333333';
const variantId = '44444444-4444-4444-8444-444444444444';
const saleId = '55555555-5555-4555-8555-555555555555';
const saleLineId = '66666666-6666-4666-8666-666666666666';
const effectiveAt = '2026-09-02T00:00:00.000Z';

const location: SellingLocation = {
  id: locationId,
  code: 'MAIN',
  name: 'Main Branch',
  status: 'ACTIVE',
  version: 1,
  createdAt: effectiveAt,
  updatedAt: effectiveAt,
};

const category: CatalogCategory = {
  id: categoryId,
  code: 'SERVICES',
  name: 'Services',
  status: 'ACTIVE',
  version: 1,
  createdAt: effectiveAt,
  updatedAt: effectiveAt,
};

const item: CatalogItem = {
  id: itemId,
  code: 'CUT',
  name: 'Haircut',
  type: 'SERVICE',
  categoryId,
  taxCategoryId: null,
  description: null,
  lifecycle: 'ACTIVE',
  fulfillmentBehavior: 'INSTANT',
  version: 1,
  createdAt: effectiveAt,
  updatedAt: effectiveAt,
  serviceDefinition: {
    defaultDurationMinutes: 30,
    employeeAssignmentMode: 'OPTIONAL',
    allowEmployeeContribution: true,
  },
};

const variant: CatalogVariant = {
  id: variantId,
  catalogItemId: itemId,
  code: 'SENIOR',
  name: 'Senior Stylist',
  status: 'ACTIVE',
  version: 1,
  createdAt: effectiveAt,
  updatedAt: effectiveAt,
};

const price: ResolvedPrice = {
  catalogPriceId: '77777777-7777-4777-8777-777777777777',
  catalogItemId: itemId,
  catalogVariantId: variantId,
  locationId,
  currency: 'IDR',
  amount: '125000.0000',
  effectiveAt,
  sourceScope: {
    catalogVariantId: null,
    locationId,
  },
};

const employee = {
  id: '88888888-8888-4888-8888-888888888888',
  code: 'EMP-01',
  displayName: 'Employee One',
  status: 'ACTIVE' as const,
  version: 1,
  createdAt: effectiveAt,
  updatedAt: effectiveAt,
};

const sale: Sale = {
  id: saleId,
  sellingLocationId: locationId,
  currency: 'IDR',
  status: 'OPEN',
  version: 3,
  grossAmount: '125000.0000',
  discountAmount: '0.0000',
  netPreTaxAmount: '125000.0000',
  taxAmount: '0.0000',
  totalAmount: '125000.0000',
  createdAt: effectiveAt,
  updatedAt: effectiveAt,
  lines: [
    {
      id: saleLineId,
      saleId,
      catalogItemId: itemId,
      catalogVariantId: variantId,
      itemCodeSnapshot: 'CUT',
      itemNameSnapshot: 'Haircut',
      itemTypeSnapshot: 'SERVICE',
      variantCodeSnapshot: 'SENIOR',
      variantNameSnapshot: 'Senior Stylist',
      fulfillmentBehaviorSnapshot: 'INSTANT',
      employeeAssignmentModeSnapshot: 'OPTIONAL',
      allowEmployeeContributionSnapshot: true,
      quantity: '1.0000',
      currency: 'IDR',
      resolvedUnitPrice: '125000.0000',
      effectiveUnitPrice: '125000.0000',
      grossAmount: '125000.0000',
      netPreTaxAmount: '125000.0000',
      taxAmount: '0.0000',
      totalAmount: '125000.0000',
      removedAt: null,
      fulfillment: null,
      participations: [],
    },
  ],
  payments: [],
};

function page<T>(item: T): ApiPage<T> {
  return { items: [item], limit: 100, offset: 0 };
}

function successResponse(data: unknown): Response {
  return new Response(
    JSON.stringify({
      success: true,
      data,
      request_id: 'cashier-adapter-test',
      timestamp: effectiveAt,
    }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  );
}

function failureResponse(status: number, code: string, message: string): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: { code, message },
      request_id: 'cashier-adapter-error',
      timestamp: effectiveAt,
    }),
    { status, headers: { 'content-type': 'application/json' } },
  );
}

function createAdapter() {
  return new HttpCashierTransactionAdapter(
    new ApiClient({ baseUrl, getAccessToken: async () => accessToken }),
  );
}

function requestInit(fetchMock: ReturnType<typeof vi.fn>, index: number): RequestInit {
  const init = fetchMock.mock.calls[index]?.[1];
  if (!init) throw new Error(`Expected request initialization at index ${index}.`);
  return init;
}

function requestJsonBody(fetchMock: ReturnType<typeof vi.fn>, index: number): unknown {
  const body = requestInit(fetchMock, index).body;
  if (typeof body !== 'string') throw new Error(`Expected JSON request body at index ${index}.`);
  return JSON.parse(body);
}

describe('HttpCashierTransactionAdapter', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('maps the backend selling catalog endpoints and resolves the current location price', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(successResponse(page(location)))
      .mockResolvedValueOnce(successResponse(page(category)))
      .mockResolvedValueOnce(successResponse(page(item)))
      .mockResolvedValueOnce(successResponse(page(variant)))
      .mockResolvedValueOnce(successResponse(price));
    vi.stubGlobal('fetch', fetchMock);
    const adapter = createAdapter();

    await expect(adapter.listSellingLocations()).resolves.toEqual(page(location));
    await expect(adapter.listCatalogCategories()).resolves.toEqual(page(category));
    await expect(adapter.listCatalogItems()).resolves.toEqual(page(item));
    await expect(adapter.listCatalogVariants(itemId)).resolves.toEqual(page(variant));
    await expect(
      adapter.resolvePrice({
        catalogItemId: itemId,
        catalogVariantId: variantId,
        sellingLocationId: locationId,
        currency: 'IDR',
        effectiveAt,
      }),
    ).resolves.toEqual(price);

    expect(fetchMock.mock.calls.map(([path]) => path)).toEqual([
      `${baseUrl}/api/v1/locations?limit=100&offset=0`,
      `${baseUrl}/api/v1/catalog/categories?limit=100&offset=0`,
      `${baseUrl}/api/v1/catalog/items?limit=100&offset=0`,
      `${baseUrl}/api/v1/catalog/items/${itemId}/variants?limit=100&offset=0`,
      `${baseUrl}/api/v1/pricing/resolve?catalogItemId=${itemId}&locationId=${locationId}&currency=IDR&effectiveAt=${encodeURIComponent(effectiveAt)}&catalogVariantId=${variantId}`,
    ]);
    expect(new Headers(requestInit(fetchMock, 0).headers).get('authorization')).toBe(
      `Bearer ${accessToken}`,
    );
  });

  it('maps paged open-sale reads and the versioned sale line commands', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(successResponse(page(sale)))
      .mockResolvedValueOnce(successResponse(sale))
      .mockResolvedValueOnce(successResponse(sale))
      .mockResolvedValueOnce(successResponse(sale))
      .mockResolvedValueOnce(successResponse(sale))
      .mockResolvedValueOnce(successResponse(sale));
    vi.stubGlobal('fetch', fetchMock);
    const adapter = createAdapter();

    await expect(adapter.listSales()).resolves.toEqual(page(sale));
    await expect(adapter.getSale(saleId)).resolves.toEqual(sale);
    await expect(
      adapter.createSale({ sellingLocationId: locationId, currency: 'IDR' }, 'create-sale-1'),
    ).resolves.toEqual(sale);
    await expect(
      adapter.addSaleLine(
        saleId,
        {
          expectedVersion: 1,
          catalogItemId: itemId,
          catalogVariantId: variantId,
          quantity: '1.0000',
        },
        'add-line-1',
      ),
    ).resolves.toEqual(sale);
    await expect(
      adapter.setSaleLineQuantity(saleId, saleLineId, {
        expectedVersion: 2,
        quantity: '2.0000',
      }),
    ).resolves.toEqual(sale);
    await expect(adapter.removeSaleLine(saleId, saleLineId, 3)).resolves.toEqual(sale);

    expect(fetchMock.mock.calls.map(([path]) => path)).toEqual([
      `${baseUrl}/api/v1/sales?limit=100&offset=0`,
      `${baseUrl}/api/v1/sales/${saleId}`,
      `${baseUrl}/api/v1/sales`,
      `${baseUrl}/api/v1/sales/${saleId}/lines`,
      `${baseUrl}/api/v1/sales/${saleId}/lines/${saleLineId}/quantity`,
      `${baseUrl}/api/v1/sales/${saleId}/lines/${saleLineId}/remove`,
    ]);
    expect(requestJsonBody(fetchMock, 2)).toEqual({
      sellingLocationId: locationId,
      currency: 'IDR',
    });
    expect(new Headers(requestInit(fetchMock, 2).headers).get('idempotency-key')).toBe(
      'create-sale-1',
    );
    expect(requestJsonBody(fetchMock, 3)).toEqual({
      expectedVersion: 1,
      catalogItemId: itemId,
      catalogVariantId: variantId,
      quantity: '1.0000',
    });
    expect(new Headers(requestInit(fetchMock, 3).headers).get('idempotency-key')).toBe(
      'add-line-1',
    );
    expect(requestJsonBody(fetchMock, 4)).toEqual({
      expectedVersion: 2,
      quantity: '2.0000',
    });
    expect(requestJsonBody(fetchMock, 5)).toEqual({ expectedVersion: 3 });
  });

  it('maps employee contribution and payment commands using backend version and idempotency rules', async () => {
    const secondEmployee = { ...employee, id: '99999999-9999-4999-8999-999999999999' };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        successResponse({ items: [employee, secondEmployee], limit: 100, offset: 0 }),
      )
      .mockResolvedValueOnce(successResponse(sale))
      .mockResolvedValueOnce(successResponse(sale))
      .mockResolvedValueOnce(successResponse(sale))
      .mockResolvedValueOnce(successResponse(sale));
    vi.stubGlobal('fetch', fetchMock);
    const adapter = createAdapter();

    await adapter.listEmployees();
    await adapter.setSaleLineAssignments(saleId, saleLineId, {
      expectedVersion: 3,
      employeeIds: [employee.id, secondEmployee.id],
    });
    await adapter.setSaleLineContributions(saleId, saleLineId, {
      expectedVersion: 4,
      contributors: [
        { employeeId: employee.id, shareRate: '0.600000000000000000' },
        { employeeId: secondEmployee.id },
      ],
    });
    await adapter.createPayment(
      saleId,
      {
        expectedVersion: 5,
        method: 'CASH',
        appliedAmount: '125000.0000',
        tenderedAmount: '150000.0000',
      },
      'payment-1',
    );
    await adapter.settlePayment(saleId, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', {
      expectedVersion: 6,
      status: 'SUCCEEDED',
    });

    expect(fetchMock.mock.calls.map(([path]) => path)).toEqual([
      `${baseUrl}/api/v1/employees?limit=100&offset=0`,
      `${baseUrl}/api/v1/sales/${saleId}/lines/${saleLineId}/assignments`,
      `${baseUrl}/api/v1/sales/${saleId}/lines/${saleLineId}/contributions`,
      `${baseUrl}/api/v1/sales/${saleId}/payments`,
      `${baseUrl}/api/v1/sales/${saleId}/payments/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/status`,
    ]);
    expect(new Headers(requestInit(fetchMock, 0).headers).get('authorization')).toBe(
      `Bearer ${accessToken}`,
    );
    expect(requestJsonBody(fetchMock, 2)).toEqual({
      expectedVersion: 4,
      contributors: [
        { employeeId: employee.id, shareRate: '0.600000000000000000' },
        { employeeId: secondEmployee.id },
      ],
    });
    expect(requestJsonBody(fetchMock, 3)).toEqual({
      expectedVersion: 5,
      method: 'CASH',
      appliedAmount: '125000.0000',
      tenderedAmount: '150000.0000',
    });
    expect(new Headers(requestInit(fetchMock, 3).headers).get('idempotency-key')).toBe('payment-1');
    expect(requestJsonBody(fetchMock, 4)).toEqual({ expectedVersion: 6, status: 'SUCCEEDED' });
  });

  it('maps tracked fulfillment and finalization to versioned backend commands', async () => {
    const trackedSale: Sale = {
      ...sale,
      version: 7,
      lines: [
        {
          ...sale.lines[0]!,
          fulfillmentBehaviorSnapshot: 'TRACKED',
          fulfillment: {
            saleId,
            saleLineId,
            status: 'IN_PROGRESS',
            startedAt: effectiveAt,
            completedAt: null,
            canceledAt: null,
          },
        },
      ],
    };
    const finalizedSale: Sale = { ...trackedSale, status: 'FINALIZED', version: 8 };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(successResponse(trackedSale))
      .mockResolvedValueOnce(successResponse(finalizedSale));
    vi.stubGlobal('fetch', fetchMock);
    const adapter = createAdapter();

    await expect(
      adapter.transitionSaleLineFulfillment(saleId, saleLineId, {
        expectedVersion: 6,
        status: 'COMPLETED',
      }),
    ).resolves.toEqual(trackedSale);
    await expect(
      adapter.finalizeSale(saleId, { expectedVersion: 7 }, 'finalize-sale-1'),
    ).resolves.toEqual(finalizedSale);

    expect(fetchMock.mock.calls.map(([path]) => path)).toEqual([
      `${baseUrl}/api/v1/sales/${saleId}/lines/${saleLineId}/fulfillment`,
      `${baseUrl}/api/v1/sales/${saleId}/finalize`,
    ]);
    expect(requestJsonBody(fetchMock, 0)).toEqual({ expectedVersion: 6, status: 'COMPLETED' });
    expect(requestJsonBody(fetchMock, 1)).toEqual({ expectedVersion: 7 });
    expect(new Headers(requestInit(fetchMock, 0).headers).get('authorization')).toBe(
      `Bearer ${accessToken}`,
    );
    expect(new Headers(requestInit(fetchMock, 1).headers).get('authorization')).toBe(
      `Bearer ${accessToken}`,
    );
    expect(new Headers(requestInit(fetchMock, 1).headers).get('idempotency-key')).toBe(
      'finalize-sale-1',
    );
  });

  it('preserves normalized backend failures for Cashier error handling', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          failureResponse(409, 'SALE_CONTRIBUTION_INVALID', 'Shares must sum exactly to one'),
        )
        .mockResolvedValueOnce(
          failureResponse(
            409,
            'PAYMENT_AMOUNT_EXCEEDS_OUTSTANDING',
            'Payment exceeds unreserved amount',
          ),
        )
        .mockResolvedValueOnce(
          failureResponse(409, 'SALE_FULFILLMENT_INVALID', 'Transition is not allowed'),
        )
        .mockResolvedValueOnce(
          failureResponse(409, 'SALE_FULFILLMENT_INCOMPLETE', 'Tracked fulfillment is incomplete'),
        ),
    );

    const adapter = createAdapter();
    const contribution = adapter.setSaleLineContributions(saleId, saleLineId, {
      expectedVersion: 3,
      contributors: [{ employeeId: employee.id, shareRate: '0.5' }],
    });
    await expect(contribution).rejects.toBeInstanceOf(ApiError);
    await expect(contribution).rejects.toEqual(
      expect.objectContaining({
        status: 409,
        code: 'SALE_CONTRIBUTION_INVALID',
        message: 'Shares must sum exactly to one',
        requestId: 'cashier-adapter-error',
      }),
    );
    await expect(
      adapter.createPayment(
        saleId,
        {
          expectedVersion: 3,
          method: 'CASH',
          appliedAmount: '200000.0000',
          tenderedAmount: '200000.0000',
        },
        'payment-over',
      ),
    ).rejects.toMatchObject({ code: 'PAYMENT_AMOUNT_EXCEEDS_OUTSTANDING' });
    await expect(
      adapter.transitionSaleLineFulfillment(saleId, saleLineId, {
        expectedVersion: 3,
        status: 'COMPLETED',
      }),
    ).rejects.toMatchObject({ code: 'SALE_FULFILLMENT_INVALID' });
    await expect(
      adapter.finalizeSale(saleId, { expectedVersion: 3 }, 'finalize-failure'),
    ).rejects.toMatchObject({ code: 'SALE_FULFILLMENT_INCOMPLETE' });
  });
});
