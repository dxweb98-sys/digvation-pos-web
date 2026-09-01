# Frontend Local Acceptance

## Required sequence

For a checkpoint handoff:

```text
install
-> contract check
-> naming check
-> format check
-> lint
-> typecheck
-> unit/integration tests
-> production build
-> browser smoke
```

Canonical command:

```bash
pnpm verify
pnpm test:e2e
```

During the normal coding loop, targeted tests and the Vite dev server are allowed. A full clean verification is mandatory before recommending a merge.

## Initial dependency lock

The first Frontend Foundation CI run intentionally permits `pnpm install --no-frozen-lockfile` because this execution environment cannot reach the npm registry and therefore cannot produce the initial `pnpm-lock.yaml` locally.

Frontend Foundation must not be marked accepted until a real package install has generated and committed `pnpm-lock.yaml`; after that, CI must switch to `pnpm install --frozen-lockfile`.

This is an explicit acceptance item, not a permanent exception.
