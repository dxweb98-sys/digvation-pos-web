# Cashier Transaction Foundation

## Objective

Establish the first real Cashier transaction boundary without expanding into payment, fulfillment, assignment, contribution, discount/override, finalize/void, customer, loyalty, refund, receipt, or reporting workflows.

The POS backend remains authoritative for Sale state, captured pricing, tax, totals, and optimistic transaction versioning.

## Backend baseline reconciled

This checkpoint is reconciled against the locked POS backend baseline:

```text
release: v0.3.0
SHA: d58327fa17322d1a98049d842f43742635e744f7
API prefix: /api/v1
```

AUTH-01 remains separately in progress. Cashier therefore preserves the accepted `AuthPort` + development `MockAuthAdapter` boundary and does not invent token persistence or authentication transport.

## Scope

In scope:

- read server-visible Selling Locations and present them as Branch/Cabang in operator UI;
- ignore inactive Selling Location history for new transaction selection;
- read active Catalog items;
- create an OPEN Sale for the selected Selling Location and runtime currency;
- add a Catalog item to the OPEN Sale with explicit decimal-string quantity;
- send backend-required `Idempotency-Key` values for create/add-line commands;
- send the latest backend Sale `version` as `expectedVersion` for add-line commands;
- keep Sale server state in TanStack Query rather than a second business-state store;
- render Sale line snapshots and totals returned by the backend;
- when Branch changes while a Sale is active, require confirmation and clear only frontend navigation context; never move, finalize, or void the existing Sale.

Explicitly out of scope:

- Payment;
- employee Assignment or Contribution;
- full Fulfillment workflow;
- line/order Discount or price Override;
- Sale Finalize or Void;
- Customer or Loyalty;
- Refund;
- Receipt;
- Reporting;
- existing/open Sale recovery and transaction history;
- catalog variant selection UX;
- frontend-authored monetary calculation authority.

## Contract classification

### FRONTEND_ONLY

- Cashier transaction page composition and loading/error/empty states.
- TanStack Query keys and mutation orchestration.
- Branch-switch confirmation and clearing of only the active Sale navigation identifier.
- Decimal-string quantity syntax validation before transport.
- Presentation formatting of backend-returned decimal strings.

### EXISTING_BACKEND_CONTRACT

Locked backend `v0.3.0` already provides:

- `GET /api/v1/locations` — current-tenant Selling Location page, including inactive history;
- `GET /api/v1/catalog/items` — current-tenant Catalog item page;
- `POST /api/v1/sales` — create Sale, requiring `Idempotency-Key`;
- `GET /api/v1/sales/:id` — authoritative Sale snapshot;
- `POST /api/v1/sales/:id/lines` — add Sale line, requiring `Idempotency-Key` and `expectedVersion`.

Sale amounts and quantities are serialized as decimal strings. Sale state and all monetary values displayed after mutation are sourced from backend responses.

### POS_BACKEND_GAP

The locked `GET /api/v1/locations` contract is tenant-scoped and requires `locations:read`, but it does **not** explicitly describe a per-cashier/per-user "permitted Branch" set.

The frontend therefore does not manufacture a user-to-Branch permission model. This checkpoint can only show ACTIVE Selling Locations that the POS backend returns to the caller. If Cashier must support a narrower per-user Branch grant, POS backend/AUTH-01 needs an authoritative contract for that scope and this adapter must consume it.

### CROSS_SERVICE_CONTRACT

None identified for this checkpoint. Cashier does not call Digvation CORE directly.

### DOMAIN_DECISION_REQUIRED

Before treating Branch access as fully closed, product/backend ownership must confirm whether current-tenant Selling Locations returned to an authorized Cashier are intentionally the complete selectable Branch set, or whether explicit per-user Branch grants are required.

This decision does not justify a frontend-only permission invention.

## State ownership

```text
runtime/config        RuntimeProvider
identity boundary     AuthPort
server Sale state     TanStack Query
selected Branch       local Cashier interaction state
active Sale identity  local navigation context only
money authority       POS backend decimal-string snapshots
```

No Zustand/Redux Sale mirror, offline write queue, or client subtotal engine is introduced.

## Validation expectations

Checkpoint handoff requires the normal repository gates:

```bash
pnpm install --frozen-lockfile
pnpm verify
pnpm test:e2e
```

`pnpm verify` must still build both Cashier and Backoffice. Browser smoke uses exact mocked POS envelopes for the currently locked contract because production AUTH-01 is not yet accepted.

## Version recommendation

Do not change the accepted package version before checkpoint approval.

If this checkpoint is accepted as the next frontend prerelease, recommend:

```text
0.1.0-alpha.2
```
