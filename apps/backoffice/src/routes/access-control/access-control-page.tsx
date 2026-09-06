import { ApiClient } from '@digvation/pos-api';
import { DButton, DBadge, DCheckbox, DConfirmDialog, DDialog, DInput, DSkeleton } from '@digvation/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { useRuntime } from '@digvation/pos-runtime';
import { canPerformBackofficeAction } from '../../auth/backoffice-access';
import { useBackofficeAuth } from '../../auth/backoffice-auth-context';
import { AccessControlApi, type AccessRole, type AccessUser } from './access-control-api';

const accessControlKeys = {
  roles: ['access-control', 'roles'] as const,
  permissions: ['access-control', 'permissions'] as const,
  users: ['access-control', 'users'] as const,
};

export function AccessControlPage() {
  const { session, getAccessToken } = useBackofficeAuth();
  const runtime = useRuntime();
  const api = useMemo(() => new AccessControlApi(new ApiClient({ baseUrl: runtime.apiBaseUrl, getAccessToken })), [getAccessToken, runtime.apiBaseUrl]);
  const [section, setSection] = useState<'roles' | 'users'>('roles');
  const [editingRole, setEditingRole] = useState<AccessRole | null | undefined>(undefined);
  const [editingUser, setEditingUser] = useState<AccessUser | null>(null);
  const [deactivatingRole, setDeactivatingRole] = useState<AccessRole | null>(null);
  const queryClient = useQueryClient();
  const rolesQuery = useQuery({ queryKey: accessControlKeys.roles, queryFn: () => api.listRoles() });
  const permissionsQuery = useQuery({ queryKey: accessControlKeys.permissions, queryFn: () => api.listPermissions() });
  const usersQuery = useQuery({ queryKey: accessControlKeys.users, queryFn: () => api.listUsers(), enabled: Boolean(session && canPerformBackofficeAction(session, 'viewUsers')) });

  if (!session) return null;
  const canCreateRole = canPerformBackofficeAction(session, 'createRole');
  const canUpdateRole = canPerformBackofficeAction(session, 'updateRole');
  const canManagePermissions = canPerformBackofficeAction(session, 'manageRolePermissions');
  const canManageUsers = canPerformBackofficeAction(session, 'manageUserRoles');
  const invalidateRoles = () => void queryClient.invalidateQueries({ queryKey: accessControlKeys.roles });
  const invalidateUsers = () => void queryClient.invalidateQueries({ queryKey: accessControlKeys.users });

  return (
    <section className="px-5 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-brand)]">Configuration</p><h1 className="mt-2 text-2xl font-bold tracking-[-0.02em]">Access Control</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">Manage tenant roles and user role assignments. Permissions are defined by the POS platform.</p></div>
          {section === 'roles' && canCreateRole ? <DButton onClick={() => setEditingRole(null)}>Create role</DButton> : null}
        </div>
        <div className="mt-7 flex gap-1 border-b border-[var(--color-border)]">
          <SectionButton active={section === 'roles'} onClick={() => setSection('roles')}>Roles</SectionButton>
          {canPerformBackofficeAction(session, 'viewUsers') ? <SectionButton active={section === 'users'} onClick={() => setSection('users')}>Users</SectionButton> : null}
        </div>
        {section === 'roles' ? <RolesPanel roles={rolesQuery.data?.items} isLoading={rolesQuery.isLoading} onEdit={setEditingRole} onDeactivate={setDeactivatingRole} canEdit={canUpdateRole || canManagePermissions} canDeactivate={canUpdateRole} /> : <UsersPanel users={usersQuery.data?.items} isLoading={usersQuery.isLoading} onEdit={setEditingUser} canEdit={canManageUsers} />}
      </div>
      <RoleEditor key={editingRole?.id ?? (editingRole === null ? 'new' : 'closed')} role={editingRole} permissions={permissionsQuery.data?.items.map((item) => item.key) ?? []} onClose={() => setEditingRole(undefined)} onChanged={invalidateRoles} api={api} canUpdate={canUpdateRole} canManagePermissions={canManagePermissions} />
      <UserRoleEditor key={editingUser?.id ?? 'closed'} user={editingUser} roles={rolesQuery.data?.items ?? []} onClose={() => setEditingUser(null)} onChanged={invalidateUsers} api={api} canManage={canManageUsers} />
      <DConfirmDialog open={Boolean(deactivatingRole)} onClose={() => setDeactivatingRole(null)} onConfirm={() => { if (deactivatingRole) void api.deactivateRole(deactivatingRole).then(() => { invalidateRoles(); setDeactivatingRole(null); }); }} title="Deactivate role?" message="Users will no longer receive this role's permissions." confirmLabel="Deactivate" variant="danger" />
    </section>
  );
}

function RolesPanel({ roles, isLoading, onEdit, onDeactivate, canEdit, canDeactivate }: { roles?: AccessRole[] | undefined; isLoading: boolean; onEdit: (role: AccessRole) => void; onDeactivate: (role: AccessRole) => void; canEdit: boolean; canDeactivate: boolean }) {
  if (isLoading) return <div className="mt-6 space-y-3"><DSkeleton className="h-14 w-full" /><DSkeleton className="h-14 w-full" /></div>;
  if (!roles?.length) return <EmptyState text="No roles are available for this workspace." />;
  return <div className="mt-6 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]"><div className="divide-y divide-[var(--color-border)]">{roles.map((role) => <div key={role.id} className="flex items-center justify-between gap-4 px-5 py-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{role.name}</p>{role.systemKey ? <DBadge variant="outline">System role</DBadge> : null}{role.status === 'INACTIVE' ? <DBadge>Inactive</DBadge> : null}</div><p className="mt-1 text-xs text-[var(--color-text-muted)]">{role.code} · {role.permissions.length} permissions</p></div>{!role.systemKey ? <div className="flex items-center gap-1">{canEdit ? <DButton variant="ghost" size="sm" onClick={() => onEdit(role)}>Manage</DButton> : null}{canDeactivate && role.status === 'ACTIVE' ? <DButton variant="ghost" size="sm" onClick={() => onDeactivate(role)}>Deactivate</DButton> : null}</div> : null}</div>)}</div></div>;
}

function UsersPanel({ users, isLoading, onEdit, canEdit }: { users?: AccessUser[] | undefined; isLoading: boolean; onEdit: (user: AccessUser) => void; canEdit: boolean }) {
  if (isLoading) return <div className="mt-6 space-y-3"><DSkeleton className="h-14 w-full" /><DSkeleton className="h-14 w-full" /></div>;
  if (!users?.length) return <EmptyState text="No POS users are available for this workspace." />;
  return <div className="mt-6 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]"><div className="divide-y divide-[var(--color-border)]">{users.map((user) => <div key={user.id} className="flex items-center justify-between gap-4 px-5 py-4"><div className="min-w-0"><p className="font-semibold">{user.displayName}</p><p className="mt-1 truncate text-xs text-[var(--color-text-muted)]">{user.username ?? 'No username'} · {user.roles.map((role) => role.name).join(', ') || 'No roles assigned'}</p></div>{canEdit ? <DButton variant="ghost" size="sm" onClick={() => onEdit(user)}>Manage roles</DButton> : null}</div>)}</div></div>;
}

function RoleEditor({ role, permissions, onClose, onChanged, api, canUpdate, canManagePermissions }: { role: AccessRole | null | undefined; permissions: string[]; onClose: () => void; onChanged: () => void; api: AccessControlApi; canUpdate: boolean; canManagePermissions: boolean }) {
  const [name, setName] = useState(role?.name ?? ''); const [code, setCode] = useState(''); const [selected, setSelected] = useState<string[]>(role?.permissions ?? []);
  const open = role !== undefined; const isNew = role === null; const current = role ?? undefined;
  const selectedPermissions = selected;
  const save = async () => { if (isNew) await api.createRole({ code, name, permissions: selectedPermissions }); else if (current) { if (canUpdate && name && name !== current.name) await api.updateRole(current, name); if (canManagePermissions) await api.replacePermissions(current, selectedPermissions); } onChanged(); onClose(); };
  const toggle = (key: string) => setSelected((value) => (value.includes(key) ? value.filter((item) => item !== key) : [...value, key]));
  return <DDialog open={open} onClose={onClose} title={isNew ? 'Create role' : `Manage ${current?.name ?? ''}`} description={current?.systemKey ? 'System roles are protected by the POS authorization policy.' : 'Role permissions are assigned from the platform permission registry.'} size="lg" footer={<><DButton variant="secondary" onClick={onClose}>Cancel</DButton>{!current?.systemKey && (isNew || canUpdate || canManagePermissions) ? <DButton onClick={() => void save()} disabled={!name || (isNew && !code)}>Save role</DButton> : null}</>}><div className="space-y-5">{!current?.systemKey ? <div className="grid gap-4 sm:grid-cols-2">{isNew ? <DInput label="Role code" value={code} onChange={setCode} placeholder="MANAGER" /> : null}<DInput label="Role name" value={name || current?.name || ''} onChange={setName} disabled={!isNew && !canUpdate} /></div> : null}<div><p className="text-sm font-semibold">Permissions</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{permissions.map((key) => <label key={key} className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"><DCheckbox checked={selectedPermissions.includes(key)} onChange={() => toggle(key)} disabled={Boolean(current?.systemKey) || !canManagePermissions && !isNew} />{formatPermission(key)}</label>)}</div></div></div></DDialog>;
}

function UserRoleEditor({ user, roles, onClose, onChanged, api, canManage }: { user: AccessUser | null; roles: AccessRole[]; onClose: () => void; onChanged: () => void; api: AccessControlApi; canManage: boolean }) {
  const [selected, setSelected] = useState<string[]>(user?.roles.map((role) => role.id) ?? []); const current = selected;
  const toggle = (id: string) => setSelected((value) => (value.includes(id) ? value.filter((item) => item !== id) : [...value, id]));
  return <DDialog open={Boolean(user)} onClose={onClose} title="Manage user roles" description={user?.displayName} footer={<><DButton variant="secondary" onClick={onClose}>Cancel</DButton>{canManage ? <DButton onClick={() => { if (user) void api.replaceUserRoles(user, current).then(() => { onChanged(); onClose(); }); }}>Save assignments</DButton> : null}</>}><div className="space-y-2">{roles.map((role) => <label key={role.id} className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] px-3 py-3 text-sm"><DCheckbox checked={current.includes(role.id)} disabled={!canManage || Boolean(role.systemKey)} onChange={() => toggle(role.id)} /><span>{role.name}</span>{role.systemKey ? <DBadge variant="outline">Protected</DBadge> : null}</label>)}</div></DDialog>;
}

function SectionButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) { return <button type="button" onClick={onClick} className={`border-b-2 px-3 py-2 text-sm font-medium ${active ? 'border-[var(--color-brand)] text-[var(--color-brand)]' : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}>{children}</button>; }
function EmptyState({ text }: { text: string }) { return <div className="mt-6 rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] p-6 text-sm text-[var(--color-text-muted)]">{text}</div>; }
function formatPermission(key: string) { return key.split(':').map((part) => part.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())).join(' · '); }
