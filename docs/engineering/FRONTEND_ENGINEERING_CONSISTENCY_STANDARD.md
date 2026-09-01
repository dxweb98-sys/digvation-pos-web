# Frontend Engineering Consistency Standard

## Naming

- directories: `kebab-case`
- source files: `kebab-case`
- React components/types: `PascalCase`
- variables/functions/hooks: `camelCase`
- hooks start with `use`
- boolean variables prefer `is`, `has`, `can`, or `should`
- ports end with `Port`
- adapters end with `Adapter`
- schemas end with `.schema.ts`
- tests end with `.test.ts` / `.test.tsx`

Avoid generic dumping grounds such as `misc`, `stuff`, or broad unowned `helpers`.

## Ownership

Feature-specific code stays close to its feature. A shared package is created only for stable reuse across application/feature boundaries.

Authoritative Sale/Payment business state must never be copied into a global client store.

## Components

Presentation components receive view models, action availability, and callbacks. They do not fetch domain data, calculate authoritative money, or decide backend policy.

## Money

Business monetary calculations use `decimal.js` through `@digvation/pos-money`. JavaScript `number` must not become business monetary authority.

## White-label

Do not branch on client name or business type. Branding and deployment topology are independent runtime configuration.
