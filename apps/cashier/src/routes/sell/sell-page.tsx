import { Button } from '@digvation/pos-ui';
import { AlertCircle, CheckCircle2, LoaderCircle, RotateCcw } from 'lucide-react';
import { useParams } from 'react-router';

import { BranchSelector } from '../../features/sell/components/branch-selector';
import { CurrentSalePane } from '../../features/sell/components/current-sale-pane';
import { SaleCompletionDialog } from '../../features/sell/components/sale-completion-dialog';
import { SaleLineTaskDialog } from '../../features/sell/components/sale-line-task-dialog';
import { SellingCatalogPane } from '../../features/sell/components/selling-catalog-pane';
import { VariantPicker } from '../../features/sell/components/variant-picker';
import { useCashierTransactionWorkspace } from '../../features/sell/use-cashier-transaction-workspace';

export function SellPage() {
  const { saleId } = useParams<{ saleId: string }>();
  const workspace = useCashierTransactionWorkspace(saleId);

  return (
    <section className="px-4 py-4 lg:px-6 lg:py-5">
      <div className="mx-auto max-w-[1800px]">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-baseline gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-brand)]">
              Cashier
            </p>
            <h1 className="text-xl font-bold tracking-[-0.03em]">Sell</h1>
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
              {workspace.canRetryLastCommand ? (
                <Button variant="secondary" onClick={workspace.retryLastCommand}>
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
          <div className="grid gap-4 xl:grid-cols-[minmax(0,68fr)_minmax(360px,32fr)]">
            <SellingCatalogPane
              items={workspace.items}
              categories={workspace.categories}
              priceByItemId={workspace.priceByItemId}
              locale={workspace.locale}
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
              locale={workspace.locale}
              onQuantityChange={workspace.changeQuantity}
              onRemove={workspace.removeLine}
              onManageLine={workspace.openLineTask}
              onContinue={workspace.openCompletion}
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

      {workspace.lineTask ? (
        <SaleLineTaskDialog
          key={`${workspace.lineTask.id}:${workspace.lineTask.updatedAt}`}
          line={workspace.lineTask}
          employees={workspace.employees}
          contributionPreview={workspace.contributionPreview}
          locale={workspace.locale}
          monetaryAvailability={workspace.viewModel.monetaryMutation}
          operationalAvailability={workspace.viewModel.operationalMutation}
          isBusy={workspace.isCoreMutating}
          onClose={workspace.closeLineTask}
          onSetPriceOverride={workspace.setPriceOverride}
          onClearPriceOverride={workspace.clearPriceOverride}
          onSetLineDiscount={workspace.setLineDiscount}
          onClearLineDiscount={workspace.clearLineDiscount}
          onSetAssignments={workspace.setAssignments}
          onSetContributions={workspace.setContributions}
          onTransitionFulfillment={workspace.transitionFulfillment}
        />
      ) : null}

      {workspace.isCompletionOpen && workspace.viewModel.sale ? (
        <SaleCompletionDialog
          key={`${workspace.viewModel.sale.id}:${workspace.viewModel.sale.version}`}
          viewModel={workspace.viewModel}
          locale={workspace.locale}
          isBusy={workspace.isCoreMutating}
          onClose={workspace.closeCompletion}
          onSetOrderDiscount={workspace.setOrderDiscount}
          onClearOrderDiscount={workspace.clearOrderDiscount}
          onCreatePayment={workspace.createPayment}
          onTransitionPayment={workspace.transitionPayment}
          onFinalize={workspace.finalizeSale}
          onVoid={() => {
            if (window.confirm('Void this unpaid OPEN Sale? This action is terminal.')) {
              workspace.voidSale();
            }
          }}
        />
      ) : null}
    </section>
  );
}
