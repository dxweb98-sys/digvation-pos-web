import { ApiClient } from '@digvation/pos-api';

import type { ApiPage, CatalogItem, Sale, SellingLocation } from './cashier-transaction.types';

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

export interface CashierTransactionPort {
  listSellingLocations(signal?: AbortSignal): Promise<ApiPage<SellingLocation>>;
  listCatalogItems(signal?: AbortSignal): Promise<ApiPage<CatalogItem>>;
  getSale(saleId: string, signal?: AbortSignal): Promise<Sale>;
  createSale(input: CreateSaleInput, idempotencyKey: string): Promise<Sale>;
  addSaleLine(saleId: string, input: AddSaleLineInput, idempotencyKey: string): Promise<Sale>;
}

export class HttpCashierTransactionAdapter implements CashierTransactionPort {
  public constructor(private readonly client: ApiClient) {}

  public listSellingLocations(signal?: AbortSignal): Promise<ApiPage<SellingLocation>> {
    return this.client.get<ApiPage<SellingLocation>>(
      `${API_PREFIX}/locations?limit=${PAGE_SIZE}&offset=0`,
      { signal },
    );
  }

  public listCatalogItems(signal?: AbortSignal): Promise<ApiPage<CatalogItem>> {
    return this.client.get<ApiPage<CatalogItem>>(
      `${API_PREFIX}/catalog/items?limit=${PAGE_SIZE}&offset=0`,
      { signal },
    );
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
}
