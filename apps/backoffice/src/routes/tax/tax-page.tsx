import { BackofficePage, BackofficePageHeader } from '../../app/layout/backoffice-page';

export function TaxPage() {
  return (
    <BackofficePage>
      <BackofficePageHeader
        eyebrow="Configuration"
        title="Tax"
        description="Tax settings will be available here."
      />
    </BackofficePage>
  );
}
