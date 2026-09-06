import {
  DBadge,
  DButton,
  DCheckbox,
  DConfirmDialog,
  DDataTable,
  DDialog,
  DInput,
  DSelect,
  DSelectFilter,
  DStatusFilter,
  DTextarea,
  useToast,
  type TableColumn,
} from '@digvation-labs/ui';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeDollarSign, Ban, Eye, Pencil, Plus } from 'lucide-react';
import { type ReactNode, useMemo, useState } from 'react';
import { useRuntime } from '@digvation/pos-runtime';

import { canPerformBackofficeAction, type BackofficeAction } from '../../auth/backoffice-access';
import { isSessionExpiredError, useBackofficeAuth } from '../../auth/backoffice-auth-context';
import { BackofficePage, BackofficePageHeader } from '../../app/layout/backoffice-page';
import { normalizeBackofficeApiError } from '../../app/api/backoffice-api-error';
import {
  CatalogApi,
  type CatalogManagementItem,
  type Category,
  type DefaultPrice,
  type Item,
  type Price,
  type Variant,
} from './catalog-api';

type Section = 'items' | 'categories';
type ItemFilterState = {
  q: string;
  type: '' | Item['type'];
  lifecycle: '' | Item['lifecycle'];
  categoryId: string;
};
type CategoryFilterState = { q: string; status: '' | Category['status'] };
const keys = {
  items: ['catalog', 'items'],
  categories: ['catalog', 'categories'],
  prices: (itemId: string) => ['catalog', 'prices', itemId] as const,
  defaults: (itemIds: string[], currency: string, effectiveAt: string) =>
    ['catalog', 'default-prices', itemIds, currency, effectiveAt] as const,
  variants: (itemId: string) => ['catalog', 'variants', itemId] as const,
  variantPrice: (itemId: string, variantId: string, currency: string, effectiveAt: string) =>
    ['catalog', 'variant-price', itemId, variantId, currency, effectiveAt] as const,
};

export function CatalogPage() {
  const { session, createApiClient } = useBackofficeAuth();
  const { apiBaseUrl, currency } = useRuntime();
  const api = useMemo(
    () => new CatalogApi(createApiClient(apiBaseUrl)),
    [apiBaseUrl, createApiClient],
  );
  const client = useQueryClient();
  const [section, setSection] = useState<Section>('items');
  const [item, setItem] = useState<Item | null | undefined>();
  const [detailItem, setDetailItem] = useState<CatalogManagementItem | null>(null);
  const [category, setCategory] = useState<Category | null | undefined>();
  const [itemQuery, setItemQuery] = useState<ItemFilterState>({
    q: '',
    type: '',
    lifecycle: '',
    categoryId: '',
  });
  const [categoryQuery, setCategoryQuery] = useState<CategoryFilterState>({ q: '', status: '' });
  const [pricingEffectiveAt, setPricingEffectiveAt] = useState(() => new Date().toISOString());
  const can = (action: BackofficeAction) =>
    Boolean(session && canPerformBackofficeAction(session, action));
  const items = useQuery({
    queryKey: [...keys.items, itemQuery],
    queryFn: () => api.listItems(toItemQuery(itemQuery)),
    enabled: Boolean(session),
  });
  const defaultPrices = useQuery({
    queryKey: keys.defaults(
      items.data?.items.map((item) => item.id) ?? [],
      currency,
      pricingEffectiveAt,
    ),
    queryFn: () =>
      api.listDefaultPrices(
        items.data?.items.map((item) => item.id) ?? [],
        currency,
        pricingEffectiveAt,
      ),
    enabled: Boolean(session && can('viewPricing') && items.data?.items.length),
  });
  const categories = useQuery({
    queryKey: [...keys.categories, categoryQuery],
    queryFn: () => api.listCategories(toCategoryQuery(categoryQuery)),
    enabled: Boolean(session),
  });
  if (!session) return null;
  const refresh = (key: readonly unknown[]) => void client.invalidateQueries({ queryKey: key });
  const defaultPriceByItemId = new Map(
    defaultPrices.data?.items.map((price) => [price.catalogItemId, price]),
  );
  const itemColumns: TableColumn<CatalogManagementItem>[] = [
    {
      key: 'name',
      label: 'Item',
      render: (x) => (
        <div>
          <p className="font-medium">{x.name}</p>
          <p className="text-xs text-[var(--color-text-muted)]">{x.code}</p>
        </div>
      ),
    },
    { key: 'type', label: 'Type', render: (x) => humanize(x.type) },
    {
      key: 'categoryId',
      label: 'Category',
      render: (x) =>
        categories.data?.items.find((category) => category.id === x.categoryId)?.name ?? '—',
    },
    {
      key: 'defaultPrice',
      label: 'Default Price',
      render: (x) => (
        <PriceLabel
          price={defaultPriceByItemId.get(x.id)}
          loading={defaultPrices.isLoading}
          available={can('viewPricing')}
        />
      ),
    },
    { key: 'variants', label: 'Variants', render: (x) => x.variantCount },
    { key: 'lifecycle', label: 'Status', render: (x) => <Status value={x.lifecycle} /> },
  ];
  const categoryColumns: TableColumn<Category>[] = [
    { key: 'name', label: 'Name' },
    { key: 'code', label: 'Code' },
    { key: 'status', label: 'Status', render: (x) => <Status value={x.status} /> },
  ];
  return (
    <BackofficePage>
      <BackofficePageHeader
        eyebrow="Master Data"
        title="Catalog"
        description="Manage items and categories."
      />
      <div className="mt-6 flex gap-1 border-b border-[var(--color-border)]">
        {(['items', 'categories'] as Section[]).map((x) => (
          <button
            key={x}
            onClick={() => setSection(x)}
            className={`border-b-2 px-3 py-2 text-sm font-medium ${section === x ? 'border-[var(--color-brand)] text-[var(--color-brand)]' : 'border-transparent text-[var(--color-text-muted)]'}`}
          >
            {x.charAt(0).toUpperCase() + x.slice(1)}
          </button>
        ))}
      </div>
      {section === 'items' && (
        <section className="mt-6">
          <DDataTable
            columns={itemColumns}
            data={items.data?.items ?? []}
            loading={items.isLoading}
            rowKey="id"
            searchable
            searchPlaceholder="Cari nama atau kode item..."
            searchValue={itemQuery.q}
            onSearchChange={(q) => setItemQuery((value) => ({ ...value, q }))}
            filters={
              <>
                <DSelectFilter
                  label="Tipe"
                  value={itemQuery.type || null}
                  onChange={(type) =>
                    setItemQuery((value) => ({ ...value, type: (type ?? '') as '' | Item['type'] }))
                  }
                  clearable
                  options={[
                    { label: 'Produk', value: 'PRODUCT' },
                    { label: 'Layanan', value: 'SERVICE' },
                  ]}
                />
                <DStatusFilter
                  label="Status"
                  value={itemQuery.lifecycle}
                  onChange={(lifecycle) =>
                    setItemQuery((value) => ({
                      ...value,
                      lifecycle: lifecycle as '' | Item['lifecycle'],
                    }))
                  }
                  allLabel="Semua"
                  options={[
                    { label: 'Draf', value: 'DRAFT' },
                    { label: 'Aktif', value: 'ACTIVE' },
                    { label: 'Nonaktif', value: 'INACTIVE' },
                  ]}
                />
                <DSelectFilter
                  label="Kategori"
                  value={itemQuery.categoryId || null}
                  onChange={(categoryId) =>
                    setItemQuery((value) => ({ ...value, categoryId: String(categoryId ?? '') }))
                  }
                  clearable
                  options={
                    categories.data?.items.map((x) => ({ label: x.name, value: x.id })) ?? []
                  }
                />
              </>
            }
            headerActions={
              can('createCatalog') ? (
                <DButton leftIcon={<Plus className="size-4" />} onClick={() => setItem(null)}>
                  Tambah item
                </DButton>
              ) : null
            }
            emptyMessage={
              itemQuery.q || itemQuery.type || itemQuery.lifecycle || itemQuery.categoryId
                ? 'No matching items found.'
                : 'No catalog items are available.'
            }
            actions={[
              { label: 'View details', icon: <Eye className="size-4" />, onClick: setDetailItem },
              {
                label: 'Edit item',
                icon: <Pencil className="size-4" />,
                onClick: setItem,
                show: () => can('updateCatalog'),
              },
            ]}
          />
        </section>
      )}
      {section === 'categories' && (
        <section className="mt-6">
          <DDataTable
            columns={categoryColumns}
            data={categories.data?.items ?? []}
            loading={categories.isLoading}
            rowKey="id"
            searchable
            searchPlaceholder="Cari nama atau kode kategori..."
            searchValue={categoryQuery.q}
            onSearchChange={(q) => setCategoryQuery((value) => ({ ...value, q }))}
            filters={
              <DStatusFilter
                label="Status"
                value={categoryQuery.status}
                onChange={(status) =>
                  setCategoryQuery((value) => ({
                    ...value,
                    status: status as '' | Category['status'],
                  }))
                }
                allLabel="Semua"
                options={[
                  { label: 'Aktif', value: 'ACTIVE' },
                  { label: 'Nonaktif', value: 'INACTIVE' },
                ]}
              />
            }
            headerActions={
              can('createCatalog') ? (
                <DButton onClick={() => setCategory(null)}>Tambah kategori</DButton>
              ) : null
            }
            emptyMessage={
              categoryQuery.q || categoryQuery.status
                ? 'No matching categories found.'
                : 'No catalog categories are available.'
            }
            actions={[
              {
                label: 'Edit category',
                icon: <Pencil className="size-4" />,
                onClick: setCategory,
                show: () => can('updateCatalog'),
              },
            ]}
          />
        </section>
      )}
      <ItemDialog
        key={item?.id ?? (item === null ? 'new' : 'closed')}
        item={item}
        categories={categories.data?.items ?? []}
        api={api}
        onClose={() => setItem(undefined)}
        onSaved={() => refresh(keys.items)}
      />
      <ItemDetailDialog
        key={detailItem?.id ?? 'closed'}
        item={detailItem}
        categories={categories.data?.items ?? []}
        defaultPrice={detailItem ? defaultPriceByItemId.get(detailItem.id) : undefined}
        defaultPriceLoading={defaultPrices.isLoading}
        currency={currency}
        effectiveAt={pricingEffectiveAt}
        api={api}
        canCreate={can('createCatalog')}
        canUpdate={can('updateCatalog')}
        canViewPricing={can('viewPricing')}
        canCreatePricing={can('createPricing')}
        canCancelPricing={can('cancelPricing')}
        onPricingChanged={() => {
          setPricingEffectiveAt(new Date().toISOString());
          refresh(keys.prices(detailItem?.id ?? ''));
        }}
        onVariantsChanged={() => refresh(keys.items)}
        onClose={() => setDetailItem(null)}
        onEdit={(selected) => {
          setDetailItem(null);
          setItem(selected);
        }}
      />
      <NamedDialog
        key={`category-${category?.id ?? (category === null ? 'new' : 'closed')}`}
        entity="Category"
        item={category}
        onClose={() => setCategory(undefined)}
        onSave={(x, input) => (x ? api.updateCategory(x, input) : api.createCategory(input))}
        onSaved={() => refresh(keys.categories)}
      />
    </BackofficePage>
  );
}

function humanize(value: string) {
  return value
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}

function toItemQuery({ q, type, lifecycle, categoryId }: ItemFilterState) {
  return {
    ...(q.trim() ? { q: q.trim() } : {}),
    ...(type ? { type } : {}),
    ...(lifecycle ? { lifecycle } : {}),
    ...(categoryId ? { categoryId } : {}),
  };
}

function toCategoryQuery({ q, status }: CategoryFilterState) {
  return {
    ...(q.trim() ? { q: q.trim() } : {}),
    ...(status ? { status } : {}),
  };
}
function Status({ value }: { value: string }) {
  const variant =
    value === 'ACTIVE'
      ? 'success'
      : value === 'DRAFT'
        ? 'warning'
        : value === 'INACTIVE'
          ? 'secondary'
          : value === 'CANCELLED'
            ? 'danger'
            : 'secondary';
  return <DBadge variant={variant}>{humanize(value)}</DBadge>;
}
function Footer({
  onClose,
  onSave,
  disabled = false,
}: {
  onClose: () => void;
  onSave: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex justify-end gap-2">
      <DButton variant="secondary" onClick={onClose}>
        Cancel
      </DButton>
      <DButton onClick={onSave} disabled={disabled}>
        Save
      </DButton>
    </div>
  );
}

function NamedDialog({
  entity,
  item,
  onClose,
  onSave,
  onSaved,
}: {
  entity: string;
  item: Category | null | undefined;
  onClose: () => void;
  onSave: (
    item: Category | null,
    input: { code?: string; name: string; status: 'ACTIVE' | 'INACTIVE' },
  ) => Promise<unknown>;
  onSaved: () => void;
}) {
  const fresh = item === null;
  const { showToast } = useToast();
  const displayName = entity === 'Category' ? 'Kategori' : entity;
  const [code, setCode] = useState(item?.code ?? '');
  const [name, setName] = useState(item?.name ?? '');
  const [status, setStatus] = useState(item?.status ?? 'ACTIVE');
  const save = async () => {
    if (!name.trim()) return;
    try {
      await onSave(item ?? null, {
        ...(code.trim() ? { code: code.trim().toUpperCase() } : {}),
        name: name.trim(),
        status,
      });
      onSaved();
      showToast({
        variant: 'success',
        title: displayName + ' berhasil ' + (fresh ? 'ditambahkan.' : 'diperbarui.'),
      });
      onClose();
    } catch (error) {
      if (!isSessionExpiredError(error))
        showToast({
          variant: 'danger',
          title: normalizeBackofficeApiError(
            error,
            'Gagal menyimpan ' + displayName.toLowerCase() + '.',
          ).safeMessage,
        });
    }
  };
  return (
    <DDialog
      open={item !== undefined}
      onClose={onClose}
      title={(fresh ? 'Add' : 'Edit') + ' ' + entity}
      footer={<Footer onClose={onClose} onSave={() => void save()} disabled={!name.trim()} />}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <DInput
          label="Code"
          hint={
            fresh
              ? 'Kosongkan untuk membuat kode otomatis.'
              : 'Code cannot be changed after creation.'
          }
          value={code}
          onChange={setCode}
          disabled={!fresh}
        />
        <DInput label="Name" value={name} onChange={setName} />
        <DSelect
          label="Status"
          value={status}
          onChange={(x) => setStatus(x as 'ACTIVE' | 'INACTIVE')}
          options={[
            { label: 'Active', value: 'ACTIVE' },
            { label: 'Inactive', value: 'INACTIVE' },
          ]}
        />
      </div>
    </DDialog>
  );
}

function ItemDialog({
  item,
  categories,
  api,
  onClose,
  onSaved,
}: {
  item: Item | null | undefined;
  categories: Category[];
  api: CatalogApi;
  onClose: () => void;
  onSaved: () => void;
}) {
  const fresh = item === null;
  const { showToast } = useToast();
  const [code, setCode] = useState(item?.code ?? '');
  const [name, setName] = useState(item?.name ?? '');
  const [type, setType] = useState<Item['type']>(item?.type ?? 'PRODUCT');
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? null);
  const [description, setDescription] = useState(item?.description ?? '');
  const [lifecycle, setLifecycle] = useState<Item['lifecycle']>(item?.lifecycle ?? 'DRAFT');
  const [fulfillmentBehavior, setFulfillmentBehavior] = useState<Item['fulfillmentBehavior']>(
    item?.fulfillmentBehavior ?? 'INSTANT',
  );
  const [defaultDurationMinutes, setDefaultDurationMinutes] = useState(
    item?.serviceDefinition?.defaultDurationMinutes?.toString() ?? '',
  );
  const [employeeAssignmentMode, setEmployeeAssignmentMode] = useState<
    NonNullable<Item['serviceDefinition']>['employeeAssignmentMode']
  >(item?.serviceDefinition?.employeeAssignmentMode ?? 'NONE');
  const [allowEmployeeContribution, setAllowEmployeeContribution] = useState(
    item?.serviceDefinition?.allowEmployeeContribution ?? false,
  );
  const parsedDefaultDuration = defaultDurationMinutes.trim()
    ? Number(defaultDurationMinutes)
    : null;
  const validDefaultDuration =
    parsedDefaultDuration === null ||
    (Number.isInteger(parsedDefaultDuration) && parsedDefaultDuration > 0);
  const save = async () => {
    if (!name.trim() || !validDefaultDuration) return;
    const serviceDefinition =
      type === 'SERVICE'
        ? {
            defaultDurationMinutes: parsedDefaultDuration,
            employeeAssignmentMode,
            allowEmployeeContribution,
          }
        : undefined;
    const input = {
      name: name.trim(),
      categoryId,
      description: description.trim() || null,
      lifecycle,
      fulfillmentBehavior,
      ...(serviceDefinition ? { serviceDefinition } : {}),
    };
    try {
      if (fresh)
        await api.createItem({
          ...input,
          ...(code.trim() ? { code: code.trim().toUpperCase() } : {}),
          type,
        });
      else if (item) await api.updateItem(item, input);
      onSaved();
      showToast({
        variant: 'success',
        title: fresh ? 'Item berhasil ditambahkan.' : 'Item berhasil diperbarui.',
      });
      onClose();
    } catch (error) {
      if (!isSessionExpiredError(error))
        showToast({
          variant: 'danger',
          title: normalizeBackofficeApiError(
            error,
            fresh ? 'Gagal menambahkan item.' : 'Gagal memperbarui item.',
          ).safeMessage,
        });
    }
  };
  return (
    <DDialog
      open={item !== undefined}
      onClose={onClose}
      title={(fresh ? 'Tambah' : 'Ubah') + ' item'}
      description={
        fresh
          ? 'Kode dan tipe item tidak dapat diubah setelah dibuat.'
          : 'Kode dan tipe item tidak dapat diubah.'
      }
      footer={
        <Footer
          onClose={onClose}
          onSave={() => void save()}
          disabled={!name.trim() || !validDefaultDuration}
        />
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <DInput
          label="Kode"
          hint={
            fresh
              ? 'Kosongkan untuk membuat kode otomatis.'
              : 'Kode tidak dapat diubah setelah dibuat.'
          }
          value={code}
          onChange={setCode}
          disabled={!fresh}
        />
        <DInput label="Nama" value={name} onChange={setName} />
        <DSelect
          label="Tipe"
          value={type}
          onChange={(x) => setType(x as Item['type'])}
          disabled={!fresh}
          options={[
            { label: 'Produk', value: 'PRODUCT' },
            { label: 'Layanan', value: 'SERVICE' },
          ]}
        />
        <DSelect
          label="Status"
          value={lifecycle}
          onChange={(x) => setLifecycle(x as Item['lifecycle'])}
          options={[
            { label: 'Draf', value: 'DRAFT' },
            { label: 'Aktif', value: 'ACTIVE' },
            { label: 'Nonaktif', value: 'INACTIVE' },
          ]}
        />
        <DSelect
          label="Kategori"
          value={categoryId}
          onChange={(x) => setCategoryId(x as string | null)}
          clearable
          options={categories.map((x) => ({ label: x.name, value: x.id }))}
        />
        <DSelect
          label="Pemenuhan"
          value={fulfillmentBehavior}
          onChange={(x) => setFulfillmentBehavior(x as Item['fulfillmentBehavior'])}
          options={[
            { label: 'Instan', value: 'INSTANT' },
            { label: 'Terlacak', value: 'TRACKED' },
          ]}
        />
      </div>
      <div className="mt-4">
        <DTextarea
          label="Deskripsi"
          value={description}
          onChange={setDescription}
          className="min-h-28"
        />
      </div>
      {type === 'SERVICE' && (
        <section className="mt-5 border-t border-[var(--color-border)] pt-5">
          <h2 className="text-base font-semibold">Konfigurasi Layanan</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <DInput
              label="Durasi default"
              hint="Opsional, dalam menit."
              value={defaultDurationMinutes}
              onChange={setDefaultDurationMinutes}
              type="number"
              min={1}
            />
            <DSelect
              label="Penugasan karyawan"
              value={employeeAssignmentMode}
              onChange={(x) =>
                setEmployeeAssignmentMode(
                  x as NonNullable<Item['serviceDefinition']>['employeeAssignmentMode'],
                )
              }
              options={[
                { label: 'Tidak ada', value: 'NONE' },
                { label: 'Opsional', value: 'OPTIONAL' },
                { label: 'Wajib', value: 'REQUIRED' },
              ]}
            />
          </div>
          {!validDefaultDuration && (
            <p className="mt-2 text-sm text-[var(--color-danger)]">
              Durasi default harus berupa bilangan bulat positif.
            </p>
          )}
          <label className="mt-4 flex items-center gap-2 text-sm">
            <DCheckbox
              checked={allowEmployeeContribution}
              onChange={(event) => setAllowEmployeeContribution(event.target.checked)}
            />{' '}
            Izinkan kontribusi karyawan
          </label>
        </section>
      )}
    </DDialog>
  );
}

function ItemDetailDialog({
  item,
  categories,
  defaultPrice,
  defaultPriceLoading,
  currency,
  effectiveAt,
  api,
  canCreate,
  canUpdate,
  canViewPricing,
  canCreatePricing,
  canCancelPricing,
  onPricingChanged,
  onVariantsChanged,
  onClose,
  onEdit,
}: {
  item: Item | null;
  categories: Category[];
  defaultPrice: DefaultPrice | undefined;
  defaultPriceLoading: boolean;
  currency: string;
  effectiveAt: string;
  api: CatalogApi;
  canCreate: boolean;
  canUpdate: boolean;
  canViewPricing: boolean;
  canCreatePricing: boolean;
  canCancelPricing: boolean;
  onPricingChanged: () => void;
  onVariantsChanged: () => void;
  onClose: () => void;
  onEdit: (item: Item) => void;
}) {
  const client = useQueryClient();
  const [editingVariant, setEditingVariant] = useState<Variant | null | undefined>();
  const [pricingTarget, setPricingTarget] = useState<'default' | Variant | null>(null);
  const variants = useQuery({
    queryKey: keys.variants(item?.id ?? ''),
    queryFn: () => api.listVariants(item!.id),
    enabled: Boolean(item),
  });
  const priceHistory = useQuery({
    queryKey: keys.prices(item?.id ?? ''),
    queryFn: () => api.listPrices(item!.id),
    enabled: Boolean(item && canViewPricing),
  });
  const resolvedVariantPrices = useQueries({
    queries: (variants.data?.items ?? []).map((variant) => ({
      queryKey: keys.variantPrice(item?.id ?? '', variant.id, currency, effectiveAt),
      queryFn: () =>
        api.resolvePrice({
          catalogItemId: item!.id,
          catalogVariantId: variant.id,
          currency,
          effectiveAt,
        }),
      enabled: Boolean(item && canViewPricing),
    })),
  });
  if (!item) return null;

  const categoryName = item.categoryId
    ? (categories.find((category) => category.id === item.categoryId)?.name ?? item.categoryId)
    : 'Not assigned';
  const refreshVariants = () => void client.invalidateQueries({ queryKey: keys.variants(item.id) });
  const refreshVariantsAndCount = () => {
    refreshVariants();
    onVariantsChanged();
  };
  const defaultHistory = (priceHistory.data?.items ?? []).filter(
    (price) => price.catalogVariantId === null && price.locationId === null,
  );
  const variantPriceById = new Map(
    (variants.data?.items ?? []).map((variant, index) => [
      variant.id,
      resolvedVariantPrices[index],
    ]),
  );

  const serviceDefinition = item.serviceDefinition;
  return (
    <DDialog
      open
      onClose={onClose}
      size="xl"
      title={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-lg font-semibold">{item.name}</span>
          <Status value={item.lifecycle} />
        </div>
      }
      description={`${item.code} · ${humanize(item.type)}`}
      footer={
        <div className="flex justify-end gap-2">
          <DButton variant="secondary" onClick={onClose}>
            Close
          </DButton>
          {canUpdate && <DButton onClick={() => onEdit(item)}>Edit item</DButton>}
        </div>
      }
    >
      <div className="space-y-5">
        <section aria-labelledby="item-basic-information-heading">
          <h2 id="item-basic-information-heading" className="text-base font-semibold">
            Informasi Dasar
          </h2>
          <dl className="mt-3 space-y-3 text-sm">
            <DetailField label="Kategori" value={categoryName} />
            <DetailField
              label="Deskripsi"
              value={item.description?.trim() || 'Tidak ada deskripsi'}
            />
            {item.type === 'PRODUCT' && (
              <DetailField label="Pemenuhan" value={humanize(item.fulfillmentBehavior)} />
            )}
          </dl>
        </section>

        {item.type === 'SERVICE' && (
          <section
            aria-labelledby="item-service-configuration-heading"
            className="border-t border-[var(--color-border)] pt-5"
          >
            <h2 id="item-service-configuration-heading" className="text-base font-semibold">
              Konfigurasi Layanan
            </h2>
            <dl className="mt-3 grid gap-x-5 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <DetailField label="Pemenuhan" value={humanize(item.fulfillmentBehavior)} />
              <DetailField
                label="Durasi default"
                value={
                  serviceDefinition?.defaultDurationMinutes != null
                    ? `${serviceDefinition.defaultDurationMinutes} menit`
                    : 'Tidak diatur'
                }
              />
              <DetailField
                label="Penugasan karyawan"
                value={
                  serviceDefinition
                    ? humanize(serviceDefinition.employeeAssignmentMode)
                    : 'Tidak diatur'
                }
              />
              <DetailField
                label="Kontribusi karyawan"
                value={
                  serviceDefinition?.allowEmployeeContribution ? 'Diizinkan' : 'Tidak diizinkan'
                }
              />
            </dl>
          </section>
        )}

        {canViewPricing && (
          <section
            aria-labelledby="item-pricing-heading"
            className="border-t border-[var(--color-border)] pt-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="item-pricing-heading" className="text-base font-semibold">
                  Harga Default
                </h2>
                <div className="mt-1 text-xl font-semibold tracking-[-0.02em]">
                  <PriceLabel
                    price={defaultPrice}
                    loading={defaultPriceLoading}
                    emptyLabel="Belum diatur"
                  />
                </div>
              </div>
              {canCreatePricing && (
                <DButton onClick={() => setPricingTarget('default')}>
                  {defaultPrice ? 'Ubah harga' : 'Atur harga'}
                </DButton>
              )}
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-semibold">Riwayat harga</h3>
              <PriceHistoryTable
                prices={defaultHistory}
                currency={currency}
                loading={priceHistory.isLoading}
                canCancel={canCancelPricing}
                onCancel={async (price) => {
                  await api.cancelPrice(price.id);
                  onPricingChanged();
                }}
                emptyMessage="Belum ada riwayat harga default."
              />
            </div>
          </section>
        )}

        <section
          aria-labelledby="item-variants-heading"
          className="border-t border-[var(--color-border)] pt-5"
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="item-variants-heading" className="text-base font-semibold">
                Variants
              </h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Manage variants for this item.
              </p>
            </div>
            {canCreate && (
              <DButton
                leftIcon={<Plus className="size-4" />}
                onClick={() => setEditingVariant(null)}
              >
                Add variant
              </DButton>
            )}
          </div>
          <DDataTable
            columns={[
              { key: 'code', label: 'Code' },
              { key: 'name', label: 'Name' },
              ...(canViewPricing
                ? [
                    {
                      key: 'price',
                      label: 'Price',
                      render: (variant: Variant) => (
                        <VariantPriceLabel
                          query={variantPriceById.get(variant.id)}
                          variantId={variant.id}
                          currency={currency}
                        />
                      ),
                    },
                  ]
                : []),
              {
                key: 'status',
                label: 'Status',
                render: (variant: Variant) => <Status value={variant.status} />,
              },
            ]}
            data={variants.data?.items ?? []}
            loading={variants.isLoading}
            rowKey="id"
            emptyMessage="No variants."
            actions={[
              {
                label: 'Edit variant',
                icon: <Pencil className="size-4" />,
                onClick: setEditingVariant,
                show: () => canUpdate,
              },
              {
                label: 'Manage variant price',
                icon: <BadgeDollarSign className="size-4" />,
                onClick: setPricingTarget,
                show: () => canViewPricing,
              },
            ]}
          />
        </section>
      </div>
      <NamedDialog
        key={`detail-variant-${editingVariant?.id ?? (editingVariant === null ? 'new' : 'closed')}`}
        entity="Variant"
        item={editingVariant as Category | null | undefined}
        onClose={() => setEditingVariant(undefined)}
        onSave={async (existing, input) =>
          existing
            ? api.updateVariant(item.id, existing as Variant, input)
            : api.createVariant(item.id, input)
        }
        onSaved={refreshVariantsAndCount}
      />
      <PriceChangeDialog
        key={pricingTarget === 'default' ? 'default-price' : (pricingTarget?.id ?? 'closed')}
        target={pricingTarget}
        item={item}
        currency={currency}
        prices={
          pricingTarget === 'default'
            ? defaultHistory
            : pricingTarget
              ? (priceHistory.data?.items ?? []).filter(
                  (price) =>
                    price.catalogVariantId === pricingTarget.id && price.locationId === null,
                )
              : []
        }
        historyLoading={priceHistory.isLoading}
        canCreate={canCreatePricing}
        canCancel={canCancelPricing}
        api={api}
        onClose={() => setPricingTarget(null)}
        onSaved={onPricingChanged}
      />
    </DDialog>
  );
}

function DetailField({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium text-[var(--color-text-muted)]">{label}</dt>
      <dd className="mt-1 break-words text-[var(--color-text)]">{value}</dd>
    </div>
  );
}

function formatPrice(amount: string, currency: string) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

function formatEffectiveAt(value: string | null) {
  if (!value) return 'Berlaku';
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  );
}

function PriceLabel({
  price,
  loading,
  available = true,
  emptyLabel = 'Belum diatur',
}: {
  price: DefaultPrice | undefined;
  loading: boolean;
  available?: boolean;
  emptyLabel?: string;
}) {
  if (!available) return <span className="text-[var(--color-text-muted)]">—</span>;
  if (loading)
    return <span className="text-sm font-normal text-[var(--color-text-muted)]">Memuat...</span>;
  return price ? (
    <span>{formatPrice(price.amount, price.currency)}</span>
  ) : (
    <span className="text-sm font-normal text-[var(--color-text-muted)]">{emptyLabel}</span>
  );
}

function VariantPriceLabel({
  query,
  variantId,
  currency,
}: {
  query:
    | {
        data:
          | {
              amount: string;
              currency: string;
              sourceScope: { catalogVariantId: string | null };
            }
          | undefined;
        isLoading: boolean;
        isError: boolean;
      }
    | undefined;
  variantId: string;
  currency: string;
}) {
  if (!query || query.isLoading)
    return <span className="text-[var(--color-text-muted)]">Memuat...</span>;
  if (query.isError || !query.data)
    return <span className="text-[var(--color-text-muted)]">Belum diatur</span>;
  const inherited = query.data.sourceScope.catalogVariantId !== variantId;
  return (
    <div>
      <p>{formatPrice(query.data.amount, query.data.currency || currency)}</p>
      {inherited && (
        <p className="text-xs text-[var(--color-text-muted)]">Menggunakan harga default</p>
      )}
    </div>
  );
}

function PriceHistoryTable({
  prices,
  currency,
  loading,
  canCancel,
  onCancel,
  emptyMessage,
}: {
  prices: Price[];
  currency: string;
  loading: boolean;
  canCancel: boolean;
  onCancel: (price: Price) => Promise<void>;
  emptyMessage: string;
}) {
  const [pending, setPending] = useState<Price | null>(null);
  const { showToast } = useToast();
  return (
    <>
      <DDataTable
        columns={[
          {
            key: 'amount',
            label: 'Harga',
            render: (price: Price) => formatPrice(price.amount, price.currency || currency),
          },
          {
            key: 'effectiveFrom',
            label: 'Berlaku mulai',
            render: (price: Price) => formatEffectiveAt(price.effectiveFrom),
          },
          {
            key: 'effectiveUntil',
            label: 'Berlaku sampai',
            render: (price: Price) => formatEffectiveAt(price.effectiveUntil),
          },
          {
            key: 'cancelledAt',
            label: 'Status',
            render: (price: Price) => <Status value={price.cancelledAt ? 'CANCELLED' : 'ACTIVE'} />,
          },
        ]}
        data={prices}
        loading={loading}
        rowKey="id"
        emptyMessage={emptyMessage}
        actions={[
          {
            label: 'Cancel price',
            icon: <Ban className="size-4" />,
            variant: 'danger',
            onClick: setPending,
            show: (price) => canCancel && !price.cancelledAt,
          },
        ]}
      />
      <DConfirmDialog
        open={Boolean(pending)}
        onClose={() => setPending(null)}
        onConfirm={() => {
          if (pending)
            void onCancel(pending)
              .then(() => {
                showToast({ variant: 'success', title: 'Harga berhasil dibatalkan.' });
                setPending(null);
              })
              .catch((error) => {
                if (!isSessionExpiredError(error))
                  showToast({
                    variant: 'danger',
                    title: normalizeBackofficeApiError(error, 'Gagal membatalkan harga.')
                      .safeMessage,
                  });
              });
        }}
        title="Batalkan harga?"
        message="Riwayat harga tetap tersimpan, tetapi harga ini tidak lagi berlaku."
        confirmLabel="Batalkan harga"
        variant="danger"
      />
    </>
  );
}

function PriceChangeDialog({
  target,
  item,
  currency,
  prices,
  historyLoading,
  canCreate,
  canCancel,
  api,
  onClose,
  onSaved,
}: {
  target: 'default' | Variant | null;
  item: Item;
  currency: string;
  prices: Price[];
  historyLoading: boolean;
  canCreate: boolean;
  canCancel: boolean;
  api: CatalogApi;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { showToast } = useToast();
  const [amount, setAmount] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(() => new Date().toISOString().slice(0, 16));
  const variant = target && target !== 'default' ? target : null;
  const save = async () => {
    if (!target || !amount.trim() || !effectiveFrom) return;
    try {
      await api.changePrice({
        catalogItemId: item.id,
        catalogVariantId: variant?.id ?? null,
        locationId: null,
        currency,
        amount: amount.trim(),
        effectiveFrom: new Date(effectiveFrom).toISOString(),
      });
      onSaved();
      showToast({ variant: 'success', title: 'Harga berhasil diperbarui.' });
      onClose();
    } catch (error) {
      if (!isSessionExpiredError(error))
        showToast({
          variant: 'danger',
          title: normalizeBackofficeApiError(error, 'Gagal memperbarui harga.').safeMessage,
        });
    }
  };
  return (
    <DDialog
      open={Boolean(target)}
      onClose={onClose}
      title={variant ? `Harga varian — ${variant.name}` : 'Ubah harga default'}
      description={
        variant
          ? 'Harga varian adalah harga final dan tidak dihitung sebagai selisih dari harga default.'
          : 'Harga baru ditambahkan sebagai riwayat efektif; harga sebelumnya tidak diubah.'
      }
      footer={
        <div className="flex justify-end gap-2">
          <DButton variant="secondary" onClick={onClose}>
            Batal
          </DButton>
          {canCreate && (
            <DButton onClick={() => void save()} disabled={!amount.trim() || !effectiveFrom}>
              Simpan harga
            </DButton>
          )}
        </div>
      }
    >
      <div className="space-y-5">
        {canCreate && (
          <div className="grid gap-4 sm:grid-cols-2">
            <DInput label="Harga baru" value={amount} onChange={setAmount} placeholder="100000" />
            <DInput
              label="Berlaku mulai"
              type="text"
              value={effectiveFrom}
              onChange={setEffectiveFrom}
            />
            <p className="text-sm text-[var(--color-text-muted)]">Mata uang: {currency}</p>
          </div>
        )}
        <div className="border-t border-[var(--color-border)] pt-4">
          <h3 className="text-sm font-semibold">Riwayat harga</h3>
          {variant && (
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Hanya harga khusus varian yang dicatat di sini. Harga default item bukan riwayat
              varian.
            </p>
          )}
          <div className="mt-3">
            <PriceHistoryTable
              prices={prices}
              currency={currency}
              loading={historyLoading}
              canCancel={canCancel}
              onCancel={async (price) => {
                await api.cancelPrice(price.id);
                onSaved();
              }}
              emptyMessage={
                variant
                  ? 'Belum ada harga khusus untuk varian ini.'
                  : 'Belum ada riwayat harga default.'
              }
            />
          </div>
        </div>
      </div>
    </DDialog>
  );
}
