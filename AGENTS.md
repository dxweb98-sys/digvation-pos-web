# Digvation POS Web Engineering Contract

This file applies to human and AI contributors.

Read before implementation:

1. `docs/architecture/FRONTEND_ARCHITECTURE_BASELINE.md`
2. active checkpoint scope under `docs/checkpoints/`
3. `docs/engineering/FRONTEND_ENGINEERING_CONSISTENCY_STANDARD.md`
4. `docs/engineering/FRONTEND_VERSIONING_STANDARD.md`
5. `docs/engineering/FRONTEND_LOCAL_ACCEPTANCE.md`
6. `docs/integration/FRONTEND_BACKEND_RECONCILIATION_STANDARD.md`
7. `contracts/contract-lock.json`

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
- validation precedes merge recommendation;
- manual user changes are preserved and reviewed before additional edits.
