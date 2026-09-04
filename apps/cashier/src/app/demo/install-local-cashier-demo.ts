import { createDecimal } from '@digvation/pos-money';
import type { RuntimeConfig } from '@digvation/pos-runtime';

import type {
  CatalogItem,
  Employee,
  Sale,
  SaleLine,
  SellingLocation,
} from '../../features/sell/cashier-transaction.types';

const now = () => new Date().toISOString();
const page = <T>(items: readonly T[]) => ({ items, limit: 100, offset: 0 });
const success = <T>(data: T) => ({
  success: true,
  data,
  request_id: 'local-cashier-demo',
  timestamp: now(),
});
const failure = (code: string, message: string) => ({
  success: false,
  error: { code, message },
  request_id: 'local-cashier-demo',
  timestamp: now(),
});

/** Development-only HTTP fixture. ApiClient and HttpCashierTransactionAdapter remain the active path. */
export function installLocalCashierDemo(runtime: RuntimeConfig) {
  if (!import.meta.env.DEV || import.meta.env.VITE_CASHIER_DEMO === 'false') return;

  const branch: SellingLocation = {
    id: 'demo-branch-001',
    code: 'STUDIO',
    name: 'Studio Branch',
    status: 'ACTIVE',
    version: 1,
    createdAt: now(),
    updatedAt: now(),
  };
  const employees: Employee[] = ['Ari', 'Bima', 'Citra'].map((displayName, index) => ({
    id: `demo-employee-00${index + 1}`,
    code: `EMP-00${index + 1}`,
    displayName,
    status: 'ACTIVE',
    version: 1,
    createdAt: now(),
    updatedAt: now(),
  }));
  const catalog: Array<CatalogItem & { price: string }> = [
    ['Hair Styling', 'SERVICE', '125000.0000', true],
    ['Nail Care', 'SERVICE', '95000.0000', false],
    ['Facial Care', 'SERVICE', '175000.0000', false],
    ['Hair Serum', 'PRODUCT', '85000.0000', false],
    ['Care Shampoo', 'PRODUCT', '65000.0000', false],
    ['Treatment Mask', 'PRODUCT', '110000.0000', false],
  ].map(([name, type, price, requiresEmployee], index) => ({
    id: `demo-item-00${index + 1}`,
    code: `DEMO-${String(index + 1).padStart(2, '0')}`,
    name: String(name),
    type: type as CatalogItem['type'],
    price: String(price),
    categoryId: type === 'SERVICE' ? 'demo-services' : 'demo-products',
    taxCategoryId: null,
    description: null,
    lifecycle: 'ACTIVE',
    fulfillmentBehavior: 'INSTANT',
    version: 1,
    createdAt: now(),
    updatedAt: now(),
    serviceDefinition:
      type === 'SERVICE'
        ? {
            defaultDurationMinutes: 45,
            employeeAssignmentMode: requiresEmployee ? 'REQUIRED' : 'OPTIONAL',
            allowEmployeeContribution: false,
          }
        : null,
  }));
  const sales = new Map<string, Sale>();
  let sequence = 1;
  const originalFetch = window.fetch.bind(window);
  const apiOrigin = new URL(runtime.apiBaseUrl, window.location.origin).origin;
  const respond = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  const getSale = (id: string) => sales.get(id);
  const update = (sale: Sale, changes: Partial<Sale>) => {
    const next = { ...sale, ...changes, version: sale.version + 1, updatedAt: now() };
    sales.set(sale.id, next);
    return next;
  };
  const total = (quantity: string, amount: string) =>
    createDecimal(quantity).times(createDecimal(amount)).toFixed(4);

  window.fetch = async (input, init) => {
    const request = input instanceof Request ? input : new Request(input, init);
    const url = new URL(request.url);
    if (url.origin !== apiOrigin || !url.pathname.startsWith('/api/v1/'))
      return originalFetch(input, init);
    const path = url.pathname;
    const body =
      request.method === 'POST'
        ? await request
            .clone()
            .json()
            .catch(() => ({}))
        : {};
    if (request.method === 'GET' && path === '/api/v1/locations')
      return respond(success(page([branch])));
    if (request.method === 'GET' && path === '/api/v1/catalog/items')
      return respond(success(page(catalog)));
    if (request.method === 'GET' && path === '/api/v1/catalog/categories')
      return respond(success(page([])));
    if (request.method === 'GET' && path === '/api/v1/employees')
      return respond(success(page(employees)));
    if (request.method === 'GET' && path === '/api/v1/sales')
      return respond(success(page([...sales.values()])));
    if (request.method === 'GET' && path === '/api/v1/pricing/resolve') {
      const item = catalog.find((entry) => entry.id === url.searchParams.get('catalogItemId'));
      if (!item) return respond(failure('CATALOG_ITEM_NOT_FOUND', 'Demo item was not found.'), 404);
      return respond(
        success({
          catalogPriceId: `demo-price-${item.id}`,
          catalogItemId: item.id,
          catalogVariantId: null,
          locationId: branch.id,
          currency: runtime.currency,
          amount: item.price,
          effectiveAt: now(),
          sourceScope: { catalogVariantId: null, locationId: branch.id },
        }),
      );
    }
    const variants = path.match(/^\/api\/v1\/catalog\/items\/([^/]+)\/variants$/);
    if (request.method === 'GET' && variants) return respond(success(page([])));
    if (request.method === 'POST' && path === '/api/v1/sales') {
      const id = `demo-sale-${sequence++}`;
      const sale: Sale = {
        id,
        sellingLocationId: branch.id,
        currency: runtime.currency,
        status: 'OPEN',
        version: 1,
        grossAmount: '0.0000',
        discountAmount: '0.0000',
        netPreTaxAmount: '0.0000',
        taxAmount: '0.0000',
        totalAmount: '0.0000',
        orderDiscountType: null,
        orderDiscountValue: null,
        orderDiscountReason: null,
        orderDiscountAmount: '0.0000',
        finalizedAt: null,
        voidedAt: null,
        createdAt: now(),
        updatedAt: now(),
        lines: [],
        payments: [],
      };
      sales.set(id, sale);
      return respond(success(sale), 201);
    }
    const saleMatch = path.match(/^\/api\/v1\/sales\/([^/]+)(?:\/(.*))?$/);
    const sale = saleMatch ? getSale(saleMatch[1]!) : undefined;
    if (!sale) return respond(failure('SALE_NOT_FOUND', 'Demo Sale was not found.'), 404);
    const action = saleMatch![2] ?? '';
    if (request.method === 'GET' && !action) return respond(success(sale));
    if (request.method === 'POST' && action === 'lines') {
      const item = catalog.find((entry) => entry.id === body.catalogItemId);
      if (!item) return respond(failure('CATALOG_ITEM_NOT_FOUND', 'Demo item was not found.'), 404);
      const quantity = body.quantity ?? '1';
      const lineTotal = total(quantity, item.price);
      const line: SaleLine = {
        id: `demo-line-${sale.lines.length + 1}`,
        saleId: sale.id,
        catalogItemId: item.id,
        catalogVariantId: null,
        catalogPriceId: `demo-price-${item.id}`,
        itemCodeSnapshot: item.code,
        itemNameSnapshot: item.name,
        itemTypeSnapshot: item.type,
        variantCodeSnapshot: null,
        variantNameSnapshot: null,
        fulfillmentBehaviorSnapshot: 'INSTANT',
        employeeAssignmentModeSnapshot: item.serviceDefinition?.employeeAssignmentMode ?? null,
        allowEmployeeContributionSnapshot: false,
        defaultDurationMinutesSnapshot: item.serviceDefinition?.defaultDurationMinutes ?? null,
        quantity,
        currency: runtime.currency,
        resolvedUnitPrice: item.price,
        effectiveUnitPrice: item.price,
        overrideAmount: null,
        overrideReason: null,
        discountType: null,
        discountValue: null,
        discountReason: null,
        grossAmount: lineTotal,
        lineDiscountAmount: '0.0000',
        orderDiscountAllocationAmount: '0.0000',
        discountedCustomerBaseAmount: lineTotal,
        includedTaxAmount: '0.0000',
        excludedTaxAmount: '0.0000',
        netPreTaxAmount: lineTotal,
        taxAmount: '0.0000',
        totalAmount: lineTotal,
        removedAt: null,
        createdAt: now(),
        updatedAt: now(),
        fulfillment: null,
        participations: [],
        contributions: [],
      };
      const lines = [...sale.lines, line];
      const gross = lines
        .reduce((sum, entry) => sum.plus(createDecimal(entry.totalAmount)), createDecimal('0'))
        .toFixed(4);
      return respond(
        success(
          update(sale, { lines, grossAmount: gross, netPreTaxAmount: gross, totalAmount: gross }),
        ),
        201,
      );
    }
    const assignment = action.match(/^lines\/([^/]+)\/assignments$/);
    if (request.method === 'POST' && assignment) {
      const lines = sale.lines.map((line) =>
        line.id !== assignment[1]
          ? line
          : {
              ...line,
              participations: body.employeeIds.map((employeeId: string) => ({
                saleId: sale.id,
                saleLineId: line.id,
                employeeId,
                assigned: true,
                shareRate: null,
              })),
            },
      );
      return respond(success(update(sale, { lines })));
    }
    if (request.method === 'POST' && action === 'payments') {
      const payment = {
        id: `demo-payment-${sale.payments.length + 1}`,
        saleId: sale.id,
        method: body.method,
        status: body.method === 'CASH' ? 'SUCCEEDED' : 'PENDING',
        currency: runtime.currency,
        appliedAmount: body.appliedAmount,
        tenderedAmount: body.tenderedAmount ?? null,
        changeAmount:
          body.method === 'CASH'
            ? createDecimal(body.tenderedAmount ?? body.appliedAmount)
                .minus(createDecimal(body.appliedAmount))
                .toFixed(4)
            : null,
        providerReference: body.providerReference ?? null,
        idempotencyKey: 'demo',
        createdByActorId: 'demo-cashier',
        createdByActorKind: 'USER',
        settledByActorId: body.method === 'CASH' ? 'demo-cashier' : null,
        settledByActorKind: body.method === 'CASH' ? 'USER' : null,
        terminalAt: body.method === 'CASH' ? now() : null,
        createdAt: now(),
        updatedAt: now(),
      } as Sale['payments'][number];
      return respond(success(update(sale, { payments: [...sale.payments, payment] })));
    }
    if (request.method === 'POST' && action === 'finalize')
      return respond(success(update(sale, { status: 'FINALIZED', finalizedAt: now() })));
    return respond(
      failure('DEMO_UNSUPPORTED', `Demo does not support ${request.method} ${path}.`),
      400,
    );
  };
}
