# Cashier Transaction Foundation

## Objective

Establish the first production-shaped Cashier transaction workflow on the accepted Frontend Foundation without expanding into Payment, Assignment, Contribution, full Fulfillment, Discount/Override, Finalize/Void, Customer, Loyalty, Refund, Receipt, or Reporting.

The POS backend remains authoritative for Sale lifecycle, captured catalog/price/tax facts, monetary totals, fulfillment/payment facts already present in the Sale aggregate, and optimistic transaction versioning.

## Accepted frontend baseline

```text
branch: dev
SHA: 4b8c0e112285ab18a94fd117aa4ecfda00636f22
version: 0.1.0-alpha.1
```

## Backend baseline reconciled

```text
repository: https://github.com/dxweb98-sys/digvation-pos-service
release: v0.3.0
SHA: d58327fa17322d1a98049d842f43742635e744f7
API prefix: /api/v1
```

AUTH-01 remains separately in progress. Cashier preserves `AuthPort` + development `MockAuthAdapter`; it does not invent token storage or authentication transport.

## Scope

In scope:

- list current-tenant Selling Locations and present ACTIVE records as Branch/Cabang;
- auto-select the only ACTIVE Branch when exactly one exists;
- require confirmation before changing Branch while a Sale is active;
- changing Branch clears only frontend navigation context and never moves/voids/finalizes the Sale;
- list ACTIVE catalog categories and items;
- local catalog search/category filtering over the currently returned backend page;
- temporarily compose cashier pricing through `GET /pricing/resolve` behind the selling-catalog query seam;
- read active variants on demand before Add;
- lazy transaction start: selecting the first item creates an OPEN Sale and then adds the first SaleLine;
- if Create Sale succeeds but Add first line fails, keep the created empty OPEN Sale active;
- `Idempotency-Key` for Create Sale and Add SaleLine;
- retain the same idempotency key/payload when a command result is transport-ambiguous;
- route active Sale as `/sell/:saleId`;
- authoritative Sale query through TanStack Query;
- render backend SaleLine snapshots and backend monetary totals;
- direct quantity +/- convenience using decimal-safe arithmetic;
- quantity and remove send the latest backend `expectedVersion`;
- mutation retry disabled;
- `SALE_VERSION_CONFLICT` triggers latest-Sale reload and explicit conflict review, never automatic command replay;
- ambiguous non-idempotent quantity/remove results require latest-state review, never blind retry;
- pending Payment facts already present in an existing Sale disable monetary mutations without implementing Payment UI;
- centralized connectivity state disables business commits while offline;
- TanStack Query mutation `networkMode: always` prevents financial writes from silently pausing and auto-resuming later;
- basic Open Sales operational queue and recent-Sale ordering;
- switching an Open Sale is navigation only and does not mutate Sale status;
- one active Sale in the Cashier workspace while many backend Sales may remain OPEN.

## Explicitly out of scope

- Payment creation, settlement, split payment, or gateway UI;
- employee Assignment;
- employee Contribution;
- fulfillment transition controls;
- line/order Discount;
- price Override;
- Finalize;
- Void;
- Customer / Guest context;
- Loyalty;
- Refund / Reversal;
- Receipt / Sales Document;
- Sales Reporting;
- transaction analytics;
- offline transactional writes;
- WebSocket/SSE/presence/edit locks;
- production AUTH-01 adapter;
- per-user Branch grant invention;
- fake human-readable Sale reference;
- client/business-type source branching.

## Existing backend contract used

### Branch

```text
GET /api/v1/locations
permission: locations:read
```

The endpoint returns current-tenant Selling Locations including inactive history. Cashier filters ACTIVE records for new transaction selection.

### Selling Catalog

```text
GET /api/v1/catalog/categories
GET /api/v1/catalog/items
GET /api/v1/catalog/items/:itemId/variants
GET /api/v1/pricing/resolve
```

Current generic Catalog/Pricing APIs are sufficient for checkpoint integration but are not treated as the permanent optimized cashier read model.

### Sale

```text
POST /api/v1/sales
GET  /api/v1/sales
GET  /api/v1/sales/:id
POST /api/v1/sales/:id/lines
POST /api/v1/sales/:id/lines/:lineId/quantity
POST /api/v1/sales/:id/lines/:lineId/remove
```

Create and Add Line are idempotent commands. Quantity/remove are versioned but not idempotent commands and are never blindly retried.

Backend conflict code:

```text
SALE_VERSION_CONFLICT
```

Backend pending-payment monetary lock code:

```text
SALE_PAYMENT_PENDING
```

## State ownership

```text
runtime/config         RuntimeProvider
identity boundary      AuthPort
connectivity           ConnectivityProvider
selected Branch        CashierSessionProvider (session-only)
recent Sale IDs        CashierSessionProvider (session-only navigation)
server Sale state      TanStack Query
money authority        POS backend decimal-string snapshots
presentation behavior  pure SaleWorkspaceViewModel
```

No Redux/Zustand Sale mirror, local subtotal engine, business cache persistence, or offline mutation queue is introduced.

## Backend impact classification

### FRONTEND_ONLY

- responsive Cashier workspace composition;
- search/category presentation filtering;
- session-local selected Branch and recently visited Sale IDs;
- lazy Create+Add orchestration;
- first-line failure recovery behavior;
- query-key factories and server cache updates;
- conflict-review UI;
- direct qty/remove controls;
- Open Sales navigation experience;
- connectivity UI/guards.

### EXISTING_BACKEND_CONTRACT

- locations list;
- categories/items/variants;
- price resolution;
- create/list/get Sale;
- Add SaleLine;
- quantity change;
- line remove;
- optimistic version conflict;
- backend authoritative decimal monetary response.

### POS_BACKEND_GAP

Tracked in `docs/integration/FRONTEND_BACKEND_GAPS.md`:

- GAP-01 Cashier Selling Catalog Query;
- GAP-02 Priced Catalog Projection;
- GAP-03 Open Sale Operational Query;
- GAP-05 Human-Friendly Sale Reference;
- GAP-06 Atomic Transaction Start.

These gaps do not authorize backend modification from this frontend checkpoint.

### DOMAIN_DECISION_REQUIRED

The stable tenant-scoped Selling Location endpoint does not define narrower per-user Branch grants. Product/backend ownership must decide whether every authorized Cashier may select every ACTIVE tenant Branch or whether AUTH/POS needs explicit Branch grants.

Frontend does not invent that permission model.

### CROSS_SERVICE_CONTRACT

None. Browser applications do not call CORE directly.

## Validation expectations

Checkpoint handoff requires:

```bash
pnpm install --frozen-lockfile
pnpm verify
pnpm test:e2e
```

Acceptance must cover at minimum:

- lazy Create Sale + first Add Line in one operator intent;
- Create success + first Add failure keeps empty OPEN Sale active;
- quantity mutation sends latest `expectedVersion`;
- remove mutation sends latest `expectedVersion`;
- version conflict reloads latest Sale and never auto-replays;
- Open Sales switch performs no business mutation;
- both Cashier and Backoffice production builds remain green.

## Version recommendation

Keep packages at accepted `0.1.0-alpha.1` during implementation/review.

After checkpoint approval:

```text
0.1.0-alpha.2
```
