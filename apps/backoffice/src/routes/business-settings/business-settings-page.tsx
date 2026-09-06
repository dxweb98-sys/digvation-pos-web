import { ApiClient } from '@digvation/pos-api';
import { DBadge, DButton, DConfirmDialog, DDialog, DInput, DSkeleton } from '@digvation-labs/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, MapPinPlus } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useRuntime } from '@digvation/pos-runtime';
import { canPerformBackofficeAction } from '../../auth/backoffice-access';
import { useBackofficeAuth } from '../../auth/backoffice-auth-context';
import {
  BusinessSettingsApi,
  type BusinessProfile,
  type SellingLocation,
} from './business-settings-api';

const businessSettingsKeys = {
  profile: ['business-settings', 'profile'] as const,
  locations: ['business-settings', 'locations'] as const,
};

export function BusinessSettingsPage() {
  const { session, getAccessToken } = useBackofficeAuth();
  const runtime = useRuntime();
  const api = useMemo(
    () => new BusinessSettingsApi(new ApiClient({ baseUrl: runtime.apiBaseUrl, getAccessToken })),
    [getAccessToken, runtime.apiBaseUrl],
  );
  const queryClient = useQueryClient();
  const [editingProfile, setEditingProfile] = useState<BusinessProfile | null>(null);
  const [editingLocation, setEditingLocation] = useState<SellingLocation | null | undefined>(
    undefined,
  );
  const [deactivatingLocation, setDeactivatingLocation] = useState<SellingLocation | null>(null);

  const canViewProfile = session
    ? canPerformBackofficeAction(session, 'viewBusinessProfile')
    : false;
  const canUpdateProfile = session
    ? canPerformBackofficeAction(session, 'updateBusinessProfile')
    : false;
  const canViewLocations = session
    ? canPerformBackofficeAction(session, 'viewSellingLocations')
    : false;
  const canCreateLocation = session
    ? canPerformBackofficeAction(session, 'createSellingLocation')
    : false;
  const canUpdateLocation = session
    ? canPerformBackofficeAction(session, 'updateSellingLocation')
    : false;
  const profileQuery = useQuery({
    queryKey: businessSettingsKeys.profile,
    queryFn: () => api.getProfile(),
    enabled: canViewProfile,
  });
  const locationsQuery = useQuery({
    queryKey: businessSettingsKeys.locations,
    queryFn: () => api.listLocations(),
    enabled: canViewLocations,
  });
  const invalidateProfile = () =>
    void queryClient.invalidateQueries({ queryKey: businessSettingsKeys.profile });
  const invalidateLocations = () =>
    void queryClient.invalidateQueries({ queryKey: businessSettingsKeys.locations });

  if (!session) return null;

  return (
    <section className="px-5 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="max-w-6xl">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-brand)]">
          Configuration
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-[-0.02em]">Business</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
          Set your business identity and manage the selling locations available to this workspace.
        </p>

        {canViewProfile ? (
          <ProfileCard
            profile={profileQuery.data}
            isLoading={profileQuery.isLoading}
            canUpdate={canUpdateProfile}
            onEdit={setEditingProfile}
          />
        ) : null}
        {canViewLocations ? (
          <LocationsPanel
            locations={locationsQuery.data?.items}
            isLoading={locationsQuery.isLoading}
            canCreate={canCreateLocation}
            canUpdate={canUpdateLocation}
            onCreate={() => setEditingLocation(null)}
            onEdit={setEditingLocation}
            onDeactivate={setDeactivatingLocation}
          />
        ) : null}
      </div>
      <ProfileEditor
        key={editingProfile?.version ?? 'closed'}
        profile={editingProfile}
        api={api}
        onClose={() => setEditingProfile(null)}
        onChanged={invalidateProfile}
      />
      <LocationEditor
        key={editingLocation?.id ?? (editingLocation === null ? 'new' : 'closed')}
        location={editingLocation}
        api={api}
        canUpdate={canUpdateLocation}
        onClose={() => setEditingLocation(undefined)}
        onChanged={invalidateLocations}
      />
      <DConfirmDialog
        open={Boolean(deactivatingLocation)}
        onClose={() => setDeactivatingLocation(null)}
        onConfirm={() => {
          if (deactivatingLocation)
            void api.updateLocation(deactivatingLocation, { status: 'INACTIVE' }).then(() => {
              invalidateLocations();
              setDeactivatingLocation(null);
            });
        }}
        title="Deactivate selling location?"
        message="This location will remain in historical records but cannot be used as an active selling location."
        confirmLabel="Deactivate"
        variant="danger"
      />
    </section>
  );
}

function ProfileCard({
  profile,
  isLoading,
  canUpdate,
  onEdit,
}: {
  profile?: BusinessProfile | undefined;
  isLoading: boolean;
  canUpdate: boolean;
  onEdit: (profile: BusinessProfile) => void;
}) {
  return (
    <section className="mt-8 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-3">
          <span className="grid size-9 place-items-center rounded-[var(--radius-control)] bg-[var(--color-brand)]/10 text-[var(--color-brand)]">
            <Building2 className="size-[18px]" />
          </span>
          <div>
            <h2 className="font-semibold">Business profile</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              The business name used by your POS records.
            </p>
          </div>
        </div>
        {canUpdate && profile ? (
          <DButton variant="secondary" size="sm" onClick={() => onEdit(profile)}>
            Edit profile
          </DButton>
        ) : null}
      </div>
      {isLoading ? (
        <DSkeleton className="mt-5 h-6 w-52" />
      ) : (
        <p className="mt-5 text-lg font-semibold">{profile?.name ?? 'Not configured'}</p>
      )}
    </section>
  );
}

function LocationsPanel({
  locations,
  isLoading,
  canCreate,
  canUpdate,
  onCreate,
  onEdit,
  onDeactivate,
}: {
  locations?: SellingLocation[] | undefined;
  isLoading: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  onCreate: () => void;
  onEdit: (location: SellingLocation) => void;
  onDeactivate: (location: SellingLocation) => void;
}) {
  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Selling locations</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Selling locations are the branches used by POS transactions and location-specific
            pricing.
          </p>
        </div>
        {canCreate ? (
          <DButton size="sm" leftIcon={<MapPinPlus className="size-4" />} onClick={onCreate}>
            Add location
          </DButton>
        ) : null}
      </div>
      {isLoading ? (
        <div className="mt-4 space-y-3">
          <DSkeleton className="h-16 w-full" />
          <DSkeleton className="h-16 w-full" />
        </div>
      ) : !locations?.length ? (
        <div className="mt-4 rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] p-6 text-sm text-[var(--color-text-muted)]">
          No selling locations have been created yet.
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="divide-y divide-[var(--color-border)]">
            {locations.map((location) => (
              <div key={location.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{location.name}</p>
                    {location.status === 'INACTIVE' ? (
                      <DBadge>Inactive</DBadge>
                    ) : (
                      <DBadge variant="outline">Active</DBadge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">{location.code}</p>
                </div>
                {canUpdate ? (
                  <div className="flex items-center gap-1">
                    <DButton variant="ghost" size="sm" onClick={() => onEdit(location)}>
                      Edit
                    </DButton>
                    {location.status === 'ACTIVE' ? (
                      <DButton variant="ghost" size="sm" onClick={() => onDeactivate(location)}>
                        Deactivate
                      </DButton>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function ProfileEditor({
  profile,
  api,
  onClose,
  onChanged,
}: {
  profile: BusinessProfile | null;
  api: BusinessSettingsApi;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [name, setName] = useState(profile?.name ?? '');
  const save = async () => {
    if (!profile || !name.trim()) return;
    await api.updateProfile(profile, name.trim());
    onChanged();
    onClose();
  };
  return (
    <DDialog
      open={Boolean(profile)}
      onClose={onClose}
      title="Business profile"
      description="Set the name that identifies this business in POS records."
      footer={
        <>
          <DButton variant="secondary" onClick={onClose}>
            Cancel
          </DButton>
          <DButton onClick={() => void save()} disabled={!name.trim()}>
            Save profile
          </DButton>
        </>
      }
    >
      <DInput label="Business name" value={name} onChange={setName} autoFocus />
    </DDialog>
  );
}

function LocationEditor({
  location,
  api,
  canUpdate,
  onClose,
  onChanged,
}: {
  location: SellingLocation | null | undefined;
  api: BusinessSettingsApi;
  canUpdate: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const isNew = location === null;
  const [code, setCode] = useState('');
  const [name, setName] = useState(location?.name ?? '');
  const save = async () => {
    if (!name.trim()) return;
    if (isNew) {
      if (!code.trim()) return;
      await api.createLocation({ code: code.trim().toUpperCase(), name: name.trim() });
    } else if (location && canUpdate) await api.updateLocation(location, { name: name.trim() });
    onChanged();
    onClose();
  };
  return (
    <DDialog
      open={location !== undefined}
      onClose={onClose}
      title={isNew ? 'Add selling location' : 'Edit selling location'}
      description={
        isNew
          ? 'A selling location is the branch context for POS sales and location-specific prices.'
          : 'Location codes are permanent once created.'
      }
      footer={
        <>
          <DButton variant="secondary" onClick={onClose}>
            Cancel
          </DButton>
          <DButton onClick={() => void save()} disabled={!name.trim() || (isNew && !code.trim())}>
            Save location
          </DButton>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {isNew ? (
          <DInput label="Location code" value={code} onChange={setCode} placeholder="MAIN" />
        ) : (
          <DInput label="Location code" value={location?.code ?? ''} disabled />
        )}
        {<DInput label="Location name" value={name} onChange={setName} autoFocus />}
      </div>
    </DDialog>
  );
}
