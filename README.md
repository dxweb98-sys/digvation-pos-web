# Digvation POS Web

Frontend product workspace for the Digvation white-label POS platform.

## Repository status

Product implementation is performed from `dev` through capability-scoped working branches. `main` remains release/stable only.

Current implementation checkpoint:

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

## Applications

- `apps/cashier` — operational cashier experience.
- `apps/backoffice` — management/configuration experience.

Both applications consume deliberate shared packages from `packages/*`; they never import each other's internals.

## Authentication during early frontend development

Production POS AUTH-01 is still implemented in the backend track. Frontend Foundation therefore uses the approved `AuthPort` with a development-only `MockAuthAdapter`. Business screens do not know token storage or transport mechanics.

When AUTH-01 is accepted, `MockAuthAdapter` is replaced by the production adapter without redesigning business screens.

## Development

Requirements:

```text
Node.js 24.x
pnpm 11.x
```

Install:

```bash
corepack enable
pnpm install
```

Official validation before checkpoint handoff:

```bash
pnpm verify
```

Run Cashier:

```bash
pnpm dev:cashier
```

Run Backoffice:

```bash
pnpm dev:backoffice
```

## Product boundary

Digvation POS remains a domain-neutral, tenant-aware, white-label transactional product. Runtime differences are configuration/capability driven. Client-specific source forks and business-type conditionals are forbidden.

Deployment topology and branding are separate concerns:

```text
Deployment Profile
├── SHARED
├── BUSINESS_ISOLATED
└── DEDICATED

Branding Mode
├── DIGVATION_DEFAULT
└── WHITE_LABEL
```

## Backend compatibility

Current locked backend transactional baseline:

```text
Digvation POS backend v0.3.0
SHA d58327fa17322d1a98049d842f43742635e744f7
```

AUTH-01 specification baseline:

```text
SHA 9008e605b96660b5183e937b1b15088d5f6faa27
target backend release v0.4.0 after approval
```

See `contracts/contract-lock.json` and `docs/integration/FRONTEND_BACKEND_RECONCILIATION_STANDARD.md`.
