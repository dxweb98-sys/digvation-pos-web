import { BackofficePage, BackofficePageHeader } from '../../app/layout/backoffice-page';

export function DashboardPage() {
  return <BackofficePage><BackofficePageHeader eyebrow="Overview" title="Dashboard" description="Your Backoffice workspace is ready." /></BackofficePage>;
}
