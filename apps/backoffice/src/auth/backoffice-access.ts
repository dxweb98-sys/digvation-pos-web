import type { BackofficeSession } from './auth-session';

export type BackofficeCapability = 'dashboard' | 'catalog' | 'employees' | 'finance' | 'reports' | 'configuration' | 'accessControl';
export type BackofficeAction = 'createRole' | 'updateRole' | 'manageRolePermissions' | 'viewUsers' | 'manageUserRoles';

const capabilityPermissions: Record<BackofficeCapability, readonly string[]> = {
  dashboard: ['auth:self'],
  catalog: ['catalog:read'],
  employees: ['employees:read'],
  finance: ['payments:read'],
  reports: ['sales:read'],
  configuration: ['locations:read'],
  accessControl: ['roles:read'],
};

const actionPermissions: Record<BackofficeAction, readonly string[]> = {
  createRole: ['roles:create'],
  updateRole: ['roles:update'],
  manageRolePermissions: ['roles:permissions'],
  viewUsers: ['users:read'],
  manageUserRoles: ['users:roles'],
};

export function canAccessBackoffice(session: BackofficeSession, capability: BackofficeCapability): boolean {
  return capabilityPermissions[capability].every((permission) => session.identity.permissions.includes(permission));
}

export function canPerformBackofficeAction(session: BackofficeSession, action: BackofficeAction): boolean {
  return actionPermissions[action].every((permission) => session.identity.permissions.includes(permission));
}
