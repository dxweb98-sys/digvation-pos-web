import { expect, test } from '@playwright/test';

const branch = {
  id: '11111111-1111-4111-8111-111111111111',
  code: 'MAIN',
  name: 'Main Branch',
  status: 'ACTIVE',
  version: 1,
};

const catalogItem = {
  id: '22222222-2222-4222-8222-222222222222',
  code: 'HAIRCUT',
  name: 'Hair Cut',
  type: 'SERVICE',
  lifecycle: 'ACTIVE',
  fulfillmentBehavior: 'INSTANT',
  version: 1,
};

const emptySale = {
  id: '33333333-3333-4333-8333-333333333333',
  sellingLocationId: branch.id,
  currency: 'IDR',
  status: 'OPEN',
  version: 1,
  grossAmount: '0.0000',
  discountAmount: '0.0000',
  netPreTaxAmount: '0.0000',
  taxAmount: '0.0000',
  totalAmount: '0.0000',
  lines: [],
};

function envelope<T>(data: T) {
  return {
    success: true,
    data,
    request_id: 'cashier-e2e',
    timestamp: '2026-09-01T15:49:00.000Z',
  };
}

test('cashier creates an open sale and renders backend-authoritative line totals', async ({
  page,
}) => {
  let currentSale: Record<string, unknown> = emptySale;

  await page.route('http://127.0.0.1:4003/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();

    if (method === 'GET' && url.pathname === '/api/v1/locations') {
      await route.fulfill({ json: envelope({ items: [branch], limit: 100, offset: 0 }) });
      return;
    }

    if (method === 'GET' && url.pathname === '/api/v1/catalog/items') {
      await route.fulfill({ json: envelope({ items: [catalogItem], limit: 100, offset: 0 }) });
      return;
    }

    if (method === 'POST' && url.pathname === '/api/v1/sales') {
      expect(request.headers()['idempotency-key']).toBeTruthy();
      expect(request.postDataJSON()).toEqual({
        sellingLocationId: branch.id,
        currency: 'IDR',
      });
      currentSale = emptySale;
      await route.fulfill({ status: 201, json: envelope(currentSale) });
      return;
    }

    if (method === 'GET' && url.pathname === `/api/v1/sales/${emptySale.id}`) {
      await route.fulfill({ json: envelope(currentSale) });
      return;
    }

    if (method === 'POST' && url.pathname === `/api/v1/sales/${emptySale.id}/lines`) {
      expect(request.headers()['idempotency-key']).toBeTruthy();
      expect(request.postDataJSON()).toEqual({
        expectedVersion: 1,
        catalogItemId: catalogItem.id,
        quantity: '1',
      });
      currentSale = {
        ...emptySale,
        version: 2,
        grossAmount: '125000.0000',
        netPreTaxAmount: '125000.0000',
        totalAmount: '125000.0000',
        lines: [
          {
            id: '44444444-4444-4444-8444-444444444444',
            saleId: emptySale.id,
            catalogItemId: catalogItem.id,
            catalogVariantId: null,
            itemCodeSnapshot: catalogItem.code,
            itemNameSnapshot: catalogItem.name,
            itemTypeSnapshot: catalogItem.type,
            quantity: '1.0000',
            currency: 'IDR',
            effectiveUnitPrice: '125000.0000',
            totalAmount: '125000.0000',
            removedAt: null,
          },
        ],
      };
      await route.fulfill({ status: 201, json: envelope(currentSale) });
      return;
    }

    await route.fulfill({
      status: 404,
      json: {
        success: false,
        error: { code: 'E2E_UNHANDLED', message: `${method} ${url.pathname}` },
        request_id: 'cashier-e2e',
        timestamp: '2026-09-01T15:49:00.000Z',
      },
    });
  });

  await page.goto('/sell');

  await expect(page.getByRole('heading', { name: 'Sell' })).toBeVisible();
  await expect(page.getByText('Development User')).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Branch' })).toHaveValue(branch.id);

  await page.getByRole('button', { name: 'New sale' }).click();
  await expect(page.getByRole('heading', { name: 'Current transaction' })).toBeVisible();
  await expect(page.getByText('OPEN', { exact: true })).toBeVisible();

  await page.getByRole('textbox', { name: 'Quantity' }).fill('1');
  await page.getByRole('button', { name: 'Add item' }).click();
  await expect(page.getByText('Qty 1.0000')).toBeVisible();
  await expect(page.getByText(/125\.000/).last()).toBeVisible();
});
