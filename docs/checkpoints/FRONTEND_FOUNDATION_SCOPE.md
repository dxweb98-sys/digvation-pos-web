# Frontend Foundation Scope

## Objective

Create the production-grade frontend foundation without implementing transactional business workflow.

## In scope

- pnpm workspace monorepo;
- Cashier and Backoffice deployable apps;
- React/TypeScript/Vite/React Router;
- TanStack Query provider;
- semantic design tokens and source-owned UI primitives;
- runtime configuration and capability provider boundary;
- `AuthPort` + development `MockAuthAdapter`;
- API envelope/client/error boundary;
- decimal-safe money package;
- MSW/Vitest/Testing Library/Playwright infrastructure;
- contract lock against POS backend `v0.3.0`;
- naming/versioning/Git/backend-reconciliation documentation;
- CI verification.

## Explicitly out of scope

- real Sale/SaleLine workflow;
- Payment;
- Fulfillment;
- employee assignment/contribution;
- Customer/Loyalty persistence;
- production AUTH-01 integration;
- Backoffice CRUD;
- fake analytics/dashboard data;
- Refund/Receipt/Reporting.

## Acceptance

Frontend Foundation is accepted only after:

- deterministic dependency lock exists;
- clean install succeeds;
- contract/naming/format/lint/typecheck/tests pass;
- Cashier and Backoffice production builds pass;
- Cashier browser smoke passes;
- mock auth cannot leak token concerns into screens;
- no business-type/client conditionals;
- no business-state global store;
- documentation reflects actual repository structure.

Accepted prerelease: `0.1.0-alpha.1`.
