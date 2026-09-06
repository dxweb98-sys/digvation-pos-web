import { DEmptyState } from '@digvation-labs/ui';
import { BackofficePage, BackofficePageHeader } from '../../app/layout/backoffice-page';

export function PlaceholderPage({ title }: { title: string }) {
  return <BackofficePage><BackofficePageHeader title={title} /><DEmptyState className="mt-6" title="Not available yet" description="This area will be available when its dedicated Backoffice capability is delivered." /></BackofficePage>;
}
