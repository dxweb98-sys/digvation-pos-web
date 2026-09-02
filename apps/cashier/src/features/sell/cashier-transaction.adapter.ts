import type { ApiClient } from '@digvation/pos-api';

import type {
  ApiPage,
  CatalogCategory,
  CatalogItem,
  CatalogVariant,
  Employee,
  ResolvedPrice,
  Sale,
  SellingLocation,
} from './cashier-transaction.types';

const API_PREFIX = '/api/v1';
const PAGE_SIZE = 100;

export interface CreateSaleInput {
  sellingLocationId: string;
  currency: string;
}

export interface AddSaleLineInput {
  expectedVersion: number;
  catalogItemId: string;
  catalogVariantId?: string;
  quantity: string;
}

export interface SetSaleLineQuantityInput {
  expectedVersion: number;
  quantity: string;
}

export interface SetSaleLineAssignmentsInput {
  expectedVersion: number;
  employeeIds: string[];
}

export interface SetSaleLineContributionsInput {
  expectedVersion: number;
  contributors: Array<{ employeeId: string; shareRate?: string }>;
}

export interface CreatePaymentInput {
  expectedVersion: number;
  method: 'CASH' | 'BANK_TRANSFER' | 'WALLET' | 'QRIS';
  appliedAmount: string;
  tenderedAmount?: string;
  providerReference?: string;
}

export interface SettlePaymentInput {
  expectedVersion: number;
  status: 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'EXPIRED';
}

export interface TransitionSaleLineFulfillmentInput {
  expectedVersion: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED';
}

export interface FinalizeSaleInput {
  expectedVersion: number;
}

export interface SellingCatalogQuery {
  listSellingLocations(signal?: AbortSignal): Promise<ApiPage<SellingLocation>>;
  listCatalogCategories(signal?: AbortSignal): Promise<ApiPage<CatalogCategory>>;
  listCatalogItems(signal?: AbortSignal): Promise<ApiPage<CatalogItem>>;
  listCatalogVariants(
    catalogItemId: string,
    signal?: AbortSignal,
  ): Promise<ApiPage<CatalogVariant>>;
  resolvePrice(
    input: {
      catalogItemId: string;
      catalogVariantId?: string;
      sellingLocationId: string;
      currency: string;
      effectiveAt: string;
    },
    signal?: AbortSignal,
  ): Promise<ResolvedPrice>;
}

export interface OpenSalesQuery {
  listSales(signal?: AbortSignal): Promise<ApiPage<Sale>>;
}

export interface SaleTransactionClient {
  listEmployees(signal?: AbortSignal): Promise<ApiPage<Employee>>;
  getSale(saleId: string, signal?: AbortSignal): Promise<Sale>;
  createSale(input: CreateSaleInput, idempotencyKey: string): Promise<Sale>;
  addSaleLine(saleId: string, input: AddSaleLineInput, idempotencyKey: string): Promise<Sale>;
  setSaleLineQuantity(
    saleId: string,
    saleLineId: string,
    input: SetSaleLineQuantityInput,
  ): Promise<Sale>;
  removeSaleLine(saleId: string, saleLineId: string, expectedVersion: number): Promise<Sale>;
  setSaleLineAssignments(
    saleId: string,
    saleLineId: string,
    input: SetSaleLineAssignmentsInput,
  ): Promise<Sale>;
  setSaleLineContributions(
    saleId: string,
    saleLineId: string,
    input: SetSaleLineContributionsInput,
  ): Promise<Sale>;
  createPayment(saleId: string, input: CreatePaymentInput, idempotencyKey: string): Promise<Sale>;
  settlePayment(saleId: string, paymentId: string, input: SettlePaymentInput): Promise<Sale>;
  transitionSaleLineFulfillment(
    saleId: string,
    saleLineId: string,
    input: TransitionSaleLineFulfillmentInput,
  ): Promise<Sale>;
  finalizeSale(saleId: string, input: FinalizeSaleInput, idempotencyKey: string): Promise<Sale>;
}

function pagePath(path: string): string {
  return `${path}?limit=${PAGE_SIZE}&offset=0`;
}

export class HttpCashierTransactionAdapter
  implements SellingCatalogQuery, OpenSalesQuery, SaleTransactionClient
{
  public constructor(private readonly client: ApiClient) {}

  public listSellingLocations(signal?: AbortSignal): Promise<ApiPage<SellingLocation>> {
    return this.client.get<ApiPage<SellingLocation>>(pagePath(`${API_PREFIX}/locations`), {
      signal,
    });
  }

  public listCatalogCategories(signal?: AbortSignal): Promise<ApiPage<CatalogCategory>> {
    return this.client.get<ApiPage<CatalogCategory>>(pagePath(`${API_PREFIX}/catalog/categories`), {
      signal,
    });
  }

  public listCatalogItems(signal?: AbortSignal): Promise<ApiPage<CatalogItem>> {
    return this.client.get<ApiPage<CatalogItem>>(pagePath(`${API_PREFIX}/catalog/items`), {
      signal,
    });
  }

  public listCatalogVariants(
    catalogItemId: string,
    signal?: AbortSignal,
  ): Promise<ApiPage<CatalogVariant>> {
    return this.client.get<ApiPage<CatalogVariant>>(
      pagePath(`${API_PREFIX}/catalog/items/${catalogItemId}/variants`),
      { signal },
    );
  }

  public resolvePrice(
    input: {
      catalogItemId: string;
      catalogVariantId?: string;
      sellingLocationId: string;
      currency: string;
      effectiveAt: string;
    },
    signal?: AbortSignal,
  ): Promise<ResolvedPrice> {
    const query = new URLSearchParams({
      catalogItemId: input.catalogItemId,
      locationId: input.sellingLocationId,
      currency: input.currency,
      effectiveAt: input.effectiveAt,
    });

    if (input.catalogVariantId) query.set('catalogVariantId', input.catalogVariantId);

    return this.client.get<ResolvedPrice>(`${API_PREFIX}/pricing/resolve?${query.toString()}`, {
      signal,
    });
  }

  public listSales(signal?: AbortSignal): Promise<ApiPage<Sale>> {
    return this.client.get<ApiPage<Sale>>(pagePath(`${API_PREFIX}/sales`), { signal });
  }

  public listEmployees(signal?: AbortSignal): Promise<ApiPage<Employee>> {
    return this.client.get<ApiPage<Employee>>(pagePath(`${API_PREFIX}/employees`), { signal });
  }

  public getSale(saleId: string, signal?: AbortSignal): Promise<Sale> {
    return this.client.get<Sale>(`${API_PREFIX}/sales/${saleId}`, { signal });
  }

  public createSale(input: CreateSaleInput, idempotencyKey: string): Promise<Sale> {
    return this.client.post<Sale>(`${API_PREFIX}/sales`, input, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
  }

  public addSaleLine(
    saleId: string,
    input: AddSaleLineInput,
    idempotencyKey: string,
  ): Promise<Sale> {
    return this.client.post<Sale>(`${API_PREFIX}/sales/${saleId}/lines`, input, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
  }

  public setSaleLineQuantity(
    saleId: string,
    saleLineId: string,
    input: SetSaleLineQuantityInput,
  ): Promise<Sale> {
    return this.client.post<Sale>(
      `${API_PREFIX}/sales/${saleId}/lines/${saleLineId}/quantity`,
      input,
    );
  }

  public removeSaleLine(
    saleId: string,
    saleLineId: string,
    expectedVersion: number,
  ): Promise<Sale> {
    return this.client.post<Sale>(`${API_PREFIX}/sales/${saleId}/lines/${saleLineId}/remove`, {
      expectedVersion,
    });
  }

  public setSaleLineAssignments(
    saleId: string,
    saleLineId: string,
    input: SetSaleLineAssignmentsInput,
  ): Promise<Sale> {
    return this.client.post<Sale>(
      `${API_PREFIX}/sales/${saleId}/lines/${saleLineId}/assignments`,
      input,
    );
  }

  public setSaleLineContributions(
    saleId: string,
    saleLineId: string,
    input: SetSaleLineContributionsInput,
  ): Promise<Sale> {
    return this.client.post<Sale>(
      `${API_PREFIX}/sales/${saleId}/lines/${saleLineId}/contributions`,
      input,
    );
  }

  public createPayment(
    saleId: string,
    input: CreatePaymentInput,
    idempotencyKey: string,
  ): Promise<Sale> {
    return this.client.post<Sale>(`${API_PREFIX}/sales/${saleId}/payments`, input, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
  }

  public settlePayment(
    saleId: string,
    paymentId: string,
    input: SettlePaymentInput,
  ): Promise<Sale> {
    return this.client.post<Sale>(
      `${API_PREFIX}/sales/${saleId}/payments/${paymentId}/status`,
      input,
    );
  }

  public transitionSaleLineFulfillment(
    saleId: string,
    saleLineId: string,
    input: TransitionSaleLineFulfillmentInput,
  ): Promise<Sale> {
    return this.client.post<Sale>(
      `${API_PREFIX}/sales/${saleId}/lines/${saleLineId}/fulfillment`,
      input,
    );
  }

  public finalizeSale(
    saleId: string,
    input: FinalizeSaleInput,
    idempotencyKey: string,
  ): Promise<Sale> {
    return this.client.post<Sale>(`${API_PREFIX}/sales/${saleId}/finalize`, input, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
  }
}
