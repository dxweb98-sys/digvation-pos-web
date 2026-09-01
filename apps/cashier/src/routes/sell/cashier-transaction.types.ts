export type RecordStatus = 'ACTIVE' | 'INACTIVE';
export type CatalogLifecycle = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export interface ApiPage<T> {
  items: T[];
  limit: number;
  offset: number;
}

export interface SellingLocation {
  id: string;
  code: string;
  name: string;
  status: RecordStatus;
  version: number;
}

export interface CatalogItem {
  id: string;
  code: string;
  name: string;
  type: 'PRODUCT' | 'SERVICE';
  lifecycle: CatalogLifecycle;
  fulfillmentBehavior: 'INSTANT' | 'TRACKED';
  version: number;
}

export interface SaleLine {
  id: string;
  saleId: string;
  catalogItemId: string;
  catalogVariantId: string | null;
  itemCodeSnapshot: string;
  itemNameSnapshot: string;
  itemTypeSnapshot: 'PRODUCT' | 'SERVICE';
  quantity: string;
  currency: string;
  effectiveUnitPrice: string;
  totalAmount: string;
  removedAt: string | null;
}

export interface Sale {
  id: string;
  sellingLocationId: string;
  currency: string;
  status: 'OPEN' | 'FINALIZED' | 'VOIDED';
  version: number;
  grossAmount: string;
  discountAmount: string;
  netPreTaxAmount: string;
  taxAmount: string;
  totalAmount: string;
  lines: SaleLine[];
}
