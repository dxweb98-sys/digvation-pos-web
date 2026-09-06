import { DEmptyState } from '@digvation-labs/ui';
import { BackofficePage, BackofficePageHeader } from '../../app/layout/backoffice-page';
import { useBackofficeLocalization } from '../../app/localization/backoffice-localization';

export function PlaceholderPage({ title }: { title: string }) {
  const { t } = useBackofficeLocalization();
  return <BackofficePage><BackofficePageHeader title={title} /><DEmptyState className="mt-6" title={t('notAvailableYet')} description={t('notAvailableDescription')} /></BackofficePage>;
}
