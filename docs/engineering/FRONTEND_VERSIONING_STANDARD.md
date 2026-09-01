# Frontend Versioning Standard

Digvation POS Web uses Semantic Versioning with prerelease lifecycle.

```text
0.1.0-alpha.1
-> 0.1.0-beta.1
-> 0.1.0-rc.1
-> 0.1.0
```

A Git commit does not automatically increment SemVer. Exact source identity is the Git SHA/build revision.

Before stable `1.0.0`:

- `alpha`: architecture/foundation and incomplete product flows;
- `beta`: usable product flow with remaining product/hardening gaps;
- `rc`: release candidate, feature-complete for the intended release;
- stable: accepted production release.

After stable release:

- PATCH: compatible fixes/security/UX correction;
- MINOR: backward-compatible product capability;
- MAJOR: intentional breaking product/application contract.

Frontend/backend versions are independent. Every frontend release records the supported backend release and SHA in `contracts/contract-lock.json`.

During Frontend Foundation implementation packages use `0.1.0-alpha.0`. Acceptance promotes the frontend application baseline to `0.1.0-alpha.1`.
