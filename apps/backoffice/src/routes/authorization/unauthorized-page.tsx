import { DButton, DEmptyState } from '@digvation-labs/ui';
import { useNavigate } from 'react-router';
import { BackofficePage } from '../../app/layout/backoffice-page';

export function UnauthorizedPage() {
  const navigate = useNavigate();
  return <BackofficePage><DEmptyState title="Access unavailable" description="Your current role does not grant access to this area." action={<DButton variant="secondary" size="sm" onClick={() => navigate('/')}>Go to dashboard</DButton>} /></BackofficePage>;
}
