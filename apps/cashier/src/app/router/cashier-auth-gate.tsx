import { useAuth } from '@digvation/pos-auth';
import { useRuntime } from '@digvation/pos-runtime';
import { Navigate } from 'react-router';

import { AppBootScreen } from '../bootstrap/app-boot-screen';
import { CashierShell } from '../shell/cashier-shell';

export function CashierAuthGate() {
  const { session, isEnteringApplication } = useAuth();
  const runtime = useRuntime();

  if (!session) return <Navigate to="/login" replace />;
  if (isEnteringApplication) {
    return (
      <AppBootScreen productName={runtime.branding.productName} message="Preparing workspace" />
    );
  }

  return <CashierShell />;
}
