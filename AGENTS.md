# Digvation POS Web Engineering Contract

This file applies to human and AI contributors.

Read before implementation:

1. `docs/architecture/FRONTEND_ARCHITECTURE_BASELINE.md`
2. active checkpoint scope under `docs/checkpoints/`
3. `docs/engineering/FRONTEND_ENGINEERING_CONSISTENCY_STANDARD.md`
4. `docs/engineering/FRONTEND_VERSIONING_STANDARD.md`
5. `docs/engineering/FRONTEND_LOCAL_ACCEPTANCE.md`
6. `docs/engineering/FRONTEND_CHANGE_HANDOFF_AND_GIT_STANDARD.md`
7. `docs/integration/FRONTEND_BACKEND_RECONCILIATION_STANDARD.md`
8. `contracts/contract-lock.json`

Rules:

- do not modify the backend repository from this frontend track;
- do not invent backend domain behavior;
- no direct browser call to Digvation CORE;
- no `businessType` or client-name source branching;
- no JavaScript-number monetary authority;
- no global mirror of Sale/Payment server state;
- generated API code, once present, is never manually edited;
- implementation happens only on working branches;
- do not expand a checkpoint because a future feature is obvious;
- use targeted Vitest checks and the relevant Vite dev server during the normal implementation loop;
- run `pnpm verify` and `pnpm test:e2e` once when a complete page, feature, or tooling change is a review candidate, not after each small edit;
- Cashier and Backoffice remain independently deployable and must not import each other's application internals;
- `contracts/contract-lock.json` records verified backend reconciliation facts; never invent a release, SHA, or transport contract;
- validation precedes merge recommendation;
- manual user changes are preserved and reviewed before additional edits.
