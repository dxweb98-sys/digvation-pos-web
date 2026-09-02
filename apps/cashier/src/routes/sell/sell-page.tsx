import { Button } from '@digvation/pos-ui';
import { AlertCircle, CheckCircle2, LoaderCircle, RotateCcw } from 'lucide-react';
import { useParams } from 'react-router';

import { BranchSelector } from '../../features/sell/components/branch-selector';
import { CurrentSalePane } from '../../features/sell/components/current-sale-pane';
import { SellingCatalogPane } from '../../features/sell/components/selling-catalog-pane';
import { VariantPicker } from '../../features/sell/components/variant-picker';
import { useCashierTransactionWorkspace } from '../../features/sell/use-cashier-transaction-workspace';

export function SellPage() {
  const { saleId } = useParams<{ saleId: string }>();
  const workspace = useCashierTransactionWorkspace(saleId);

  return (
    <section className="px-5 py-5 lg:px-8 lg:py-6">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-brand)]">
              Cashier
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em]">Sell</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
              Choose from the selling catalog. Sale state, captured price, tax, and totals remain
              authoritative on the POS backend.
            </p>
          </div>

          <BranchSelector
            locations={workspace.locations}
            value={workspace.selectedLocationId}
            isLoading={workspace.isLoadingCatalog}
            onChange={workspace.changeBranch}
          />
        </div>

        {workspace.notice ? (
          <div className="mb-5 flex flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-bold">Transaction attention</p>
                <p className="mt-1 text-[var(--color-text-muted)]">{workspace.notice}</p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              {workspace.canRetryLastAdd ? (
                <Button variant="secondary" onClick={workspace.retryLastAdd}>
                  <RotateCcw className="mr-2 size-4" /> Retry same command
                </Button>
              ) : null}
              {workspace.viewModel.primaryMode === 'CONFLICT_REVIEW' ? (
                <Button variant="secondary" onClick={workspace.acknowledgeLatestState}>
                  <CheckCircle2 className="mr-2 size-4" /> Reviewed
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}

        {workspace.isLoadingSale ? (
          <div className="flex min-h-80 items-center justify-center rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-muted)]">
            <LoaderCircle className="mr-2 size-4 animate-spin" /> Loading Sale…
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,68fr)_minmax(360px,32fr)]">
            <SellingCatalogPane
              items={workspace.items}
              categories={workspace.categories}
              priceByItemId={workspace.priceByItemId}
              locale={workspace.viewModel.sale?.currency ? 'id-ID' : 'id-ID'}
              search={workspace.search}
              categoryId={workspace.categoryId}
              isLoading={workspace.isLoadingCatalog}
              availability={workspace.viewModel.monetaryMutation}
              hasBranch={Boolean(workspace.selectedLocationId)}
              onSearchChange={workspace.setSearch}
              onCategoryChange={workspace.setCategoryId}
              onSelectItem={workspace.selectItem}
            />
            <CurrentSalePane
              viewModel={workspace.viewModel}
              locale="id-ID"
              onQuantityChange={workspace.changeQuantity}
              onRemove={workspace.removeLine}
              onNewSale={workspace.newSale}
              onOpenSales={workspace.openSales}
            />
          </div>
        )}
      </div>

      {workspace.variantPicker ? (
        <VariantPicker
          {...workspace.variantPicker}
          onSelect={workspace.selectVariant}
          onClose={workspace.closeVariantPicker}
        />
      ) : null}
    </section>
  );
}
