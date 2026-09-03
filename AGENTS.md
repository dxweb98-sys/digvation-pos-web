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

- inspect branch, `git status`, recent history, and current diff before editing; preserve valid manual/user changes;
- read the smallest relevant source-of-truth set; do not repeatedly audit the entire repository when the architecture/checkpoint is already accepted;
- do not modify the backend repository from this frontend track;
- do not invent backend domain behavior;
- no direct browser call to Digvation CORE;
- no `businessType`, client-name, white-label-name, or deployment-profile source branching for business behavior;
- white-label branding, deployment isolation, and infrastructure ownership are independent runtime/configuration concerns and must not create client-specific source forks;
- no JavaScript-number monetary authority;
- no global mirror of Sale/Payment server state;
- generated API code, once present, is never manually edited;
- implementation happens only on working branches;
- do not expand a checkpoint because a future feature is obvious;
- keep feature code co-located and app ownership clear; Cashier must not import Backoffice internals and Backoffice must not import Cashier internals;
- shared packages/primitives require justified stable reuse; do not move code into shared merely because it might be reused later;
- names must follow the canonical vocabulary and naming rules in `FRONTEND_ENGINEERING_CONSISTENCY_STANDARD.md` across components, hooks, adapters, schemas, routes, tests, and API-facing models;
- testing is completion-oriented: do not run `pnpm verify`/the full suite after every small edit. During active implementation use the dev server and targeted checks only when materially useful; run full clean verification when the coherent page/feature/checkpoint is complete and being prepared for review/merge;
- earlier targeted verification is appropriate for money, auth/authorization, route guards, contract changes, shared primitives, and other high-risk boundaries;
- Cashier and Backoffice are independently deployable applications and own their release versions independently; a Git commit does not automatically bump either app version;
- validation precedes merge recommendation;
- manual user changes are preserved and reviewed before additional edits.

If a requested change would redefine backend domain semantics, CORE/POS ownership, application boundaries, deployment/white-label semantics, or another locked architecture decision, stop the affected work and report `DECISION REQUIRED` rather than silently redesigning it.
