import type { BackofficeSession } from './auth-session';

export type BackofficeCapability =
  | 'dashboard'
  | 'catalog'
  | 'employees'
  | 'finance'
  | 'reports'
  | 'configuration'
  | 'accessControl';

export type BackofficeAction =
  | 'createRole'
  | 'updateRole'
  | 'manageRolePermissions'
  | 'viewUsers'
  | 'manageUserRoles'
  | 'viewBusinessProfile'
  | 'updateBusinessProfile'
  | 'viewSellingLocations'
  | 'createSellingLocation'
  | 'updateSellingLocation';

interface PermissionRequirement {
  allOf?: readonly string[];
  anyOf?: readonly string[];
}

const capabilityPermissions: Record<
  BackofficeCapability,
  PermissionRequirement
> = {
  dashboard: { allOf: ['auth:self'] },
  catalog: { allOf: ['catalog:read'] },
  employees: { allOf: ['employees:read'] },
  finance: { allOf: ['payments:read'] },
  reports: { allOf: ['sales:read'] },

  configuration: {
    anyOf: ['business-profile:read', 'locations:read'],
  },

  accessControl: {
    allOf: ['roles:read'],
  },
};

const actionPermissions: Record<BackofficeAction, readonly string[]> = {
  createRole: ['roles:create'],
  updateRole: ['roles:update'],
  manageRolePermissions: ['roles:permissions'],
  viewUsers: ['users:read'],
  manageUserRoles: ['users:roles'],

  viewBusinessProfile: ['business-profile:read'],
  updateBusinessProfile: ['business-profile:update'],

  viewSellingLocations: ['locations:read'],
  createSellingLocation: ['locations:create'],
  updateSellingLocation: ['locations:update'],
};

export function canAccessBackoffice(
  session: BackofficeSession,
  capability: BackofficeCapability,
): boolean {
  const requirement = capabilityPermissions[capability];

  const hasAll = (requirement.allOf ?? []).every((permission) =>
    session.identity.permissions.includes(permission),
  );

  const hasAny =
    !requirement.anyOf ||
    requirement.anyOf.some((permission) =>
      session.identity.permissions.includes(permission),
    );

  return hasAll && hasAny;
}

export function canPerformBackofficeAction(
  session: BackofficeSession,
  action: BackofficeAction,
): boolean {
  return actionPermissions[action].every((permission) =>
    session.identity.permissions.includes(permission),
  );
}
