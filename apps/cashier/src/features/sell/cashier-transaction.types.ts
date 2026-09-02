export type RecordStatus = 'ACTIVE' | 'INACTIVE';
export type CatalogLifecycle = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
export type SaleStatus = 'OPEN' | 'FINALIZED' | 'VOIDED';
export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'EXPIRED';
export type FulfillmentStatus = 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED';

export interface ApiPage<T> {
  items: T[];
  limit: number;
  offset: number;
}

export interface NamedRecord {
  id: string;
  code: string;
  name: string;
  status: RecordStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export type SellingLocation = NamedRecord;
export type CatalogCategory = NamedRecord;

export interface ServiceDefinition {
  defaultDurationMinutes: number | null;
  employeeAssignmentMode: 'NONE' | 'OPTIONAL' | 'REQUIRED';
  allowEmployeeContribution: boolean;
}

export interface CatalogItem {
  id: string;
  code: string;
  name: string;
  type: 'PRODUCT' | 'SERVICE';
  categoryId: string | null;
  taxCategoryId: string | null;
  description: string | null;
  lifecycle: CatalogLifecycle;
  fulfillmentBehavior: 'INSTANT' | 'TRACKED';
  version: number;
  createdAt: string;
  updatedAt: string;
  serviceDefinition: ServiceDefinition | null;
}

export interface CatalogVariant extends NamedRecord {
  catalogItemId: string;
}

export interface ResolvedPrice {
  catalogPriceId: string;
  catalogItemId: string;
  catalogVariantId: string | null;
  locationId: string | null;
  currency: string;
  amount: string;
  effectiveAt: string;
  sourceScope: {
    catalogVariantId: string | null;
    locationId: string | null;
  };
}

export interface SalePaymentSummary {
  id: string;
  saleId: string;
  method: 'CASH' | 'BANK_TRANSFER' | 'WALLET' | 'QRIS';
  status: PaymentStatus;
  currency: string;
  appliedAmount: string;
  tenderedAmount: string | null;
  changeAmount: string | null;
  providerReference: string | null;
  terminalAt: string | null;
}

export interface Employee {
  id: string;
  code: string;
  displayName: string;
  status: RecordStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface SaleParticipation {
  employeeId: string;
  assigned: boolean;
  shareRate: string | null;
}

export interface SaleLineFulfillment {
  saleId: string;
  saleLineId: string;
  status: FulfillmentStatus;
  startedAt: string | null;
  completedAt: string | null;
  canceledAt: string | null;
}

export interface SaleLine {
  id: string;
  saleId: string;
  catalogItemId: string;
  catalogVariantId: string | null;
  itemCodeSnapshot: string;
  itemNameSnapshot: string;
  itemTypeSnapshot: 'PRODUCT' | 'SERVICE';
  variantCodeSnapshot: string | null;
  variantNameSnapshot: string | null;
  fulfillmentBehaviorSnapshot: 'INSTANT' | 'TRACKED';
  employeeAssignmentModeSnapshot: 'NONE' | 'OPTIONAL' | 'REQUIRED' | null;
  allowEmployeeContributionSnapshot: boolean;
  quantity: string;
  currency: string;
  resolvedUnitPrice: string;
  effectiveUnitPrice: string;
  grossAmount: string;
  netPreTaxAmount: string;
  taxAmount: string;
  totalAmount: string;
  removedAt: string | null;
  fulfillment: SaleLineFulfillment | null;
  participations: SaleParticipation[];
}

export interface Sale {
  id: string;
  sellingLocationId: string;
  currency: string;
  status: SaleStatus;
  version: number;
  grossAmount: string;
  discountAmount: string;
  netPreTaxAmount: string;
  taxAmount: string;
  totalAmount: string;
  createdAt: string;
  updatedAt: string;
  lines: SaleLine[];
  payments: SalePaymentSummary[];
}

export interface OpenSaleSummaryViewModel {
  id: string;
  sellingLocationId: string;
  locationName: string;
  totalAmount: string;
  currency: string;
  activeLineCount: number;
  updatedAt: string;
}
