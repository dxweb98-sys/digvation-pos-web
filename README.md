# Digvation POS Web

Frontend product workspace for the Digvation white-label POS platform.

## Repository status

This repository is intentionally initialized with a minimal repository seed. Product implementation starts from the `dev` integration branch through capability-scoped working branches.

Initial frontend implementation checkpoint:

```text
Frontend Foundation
```

The first accepted application prerelease will be:

```text
0.1.0-alpha.1
```

## Branch model

```text
main
  ↑ release / stable only

dev
  ↑ accepted checkpoint integration

feat/* | fix/* | refactor/* | chore/*
  ↑ implementation work
```

Normal implementation must not be performed directly on `main` or `dev`.

## Product boundary

The frontend consumes the Digvation POS backend contract while preserving POS/CORE product separation. Client differences are configuration/capability driven; client-specific or business-type source forks are forbidden.

Cashier and Backoffice are separate frontend applications in one monorepo and share only deliberate reusable packages.

## Authentication during early frontend development

Until production POS AUTH-01 is accepted by the backend track, frontend development uses the approved `AuthPort` abstraction with a development-only `MockAuthAdapter`. Business screens must not depend on token storage or authentication transport details.

## Engineering source of truth

Architecture, naming, versioning, validation, API/state interaction, Git workflow, and backend-reconciliation standards are added during Frontend Foundation from the approved Digvation POS frontend architecture freeze.

Do not expand a checkpoint merely because a future capability can be anticipated.
