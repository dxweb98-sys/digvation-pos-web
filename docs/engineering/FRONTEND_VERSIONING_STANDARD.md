# Frontend Versioning Standard

Digvation POS Web is a monorepo, but its deployable applications version independently.

Current deployable applications:

```text
Cashier
Backoffice
```

Each app owns its own Semantic Version according to its `apps/<app>/package.json` release source. The root private workspace version is repository/package-manager metadata and is not the release version of Cashier or Backoffice.

A typical prerelease lifecycle is:

```text
0.1.0-alpha.1
-> 0.1.0-beta.1
-> 0.1.0-rc.1
-> 0.1.0
```

A Git commit does not automatically increment SemVer. Exact source identity is the Git SHA/build revision.

Before stable `1.0.0`:

- `alpha`: architecture/foundation and incomplete product flows;
- `beta`: usable product flow with remaining product/hardening gaps, only when an intentional beta stage is used;
- `rc`: distributed/declared release candidate, feature-complete for the intended release;
- stable: accepted production release.

After stable release:

- PATCH: compatible fixes/security/UX correction;
- MINOR: backward-compatible product capability;
- MAJOR: intentional breaking product/application contract.

## Version timing

Do not bump an app version for every edit, commit, formatting change, documentation change, or test-only change.

Version movement occurs at an intentional accepted checkpoint/release boundary for that application. A page/feature can be implemented and reviewed without a version bump if it is not yet being finalized as a versioned release state.

Cashier and Backoffice do not need to advance together. For example, a Cashier-only accepted capability may advance Cashier while Backoffice remains unchanged.

Shared internal workspace packages do not automatically become independently versioned products. Give a shared package an independent published version only when it is intentionally distributed/versioned outside the monorepo workflow.

## Backend compatibility

Frontend and backend versions are independent. `contracts/contract-lock.json` records the supported/locked backend source contract for frontend work.

Do not synchronize frontend SemVer mechanically with POS Service SemVer or `/api/v1`.

## Release identity

Keep these concepts separate:

```text
applicationVersion = app SemVer
buildRevision      = Git SHA / build revision
backendContract    = contract-lock reference
```

An immutable deployment/release record should be able to identify all applicable values without turning Git commit count into application SemVer.

Frontend Foundation was accepted at `0.1.0-alpha.1`. Subsequent prerelease or stable increments occur only when the next meaningful app checkpoint/release boundary is accepted.
