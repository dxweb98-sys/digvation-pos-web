import { AuthProvider, type AuthPort, type AuthSession } from '@digvation/pos-auth';
import { ConnectivityProvider, RuntimeProvider, type RuntimeConfig } from '@digvation/pos-runtime';
import { ToastProvider } from '@digvation/pos-ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { RouterProviderProps } from 'react-router';
import { RouterProvider } from 'react-router/dom';

import { CashierSessionProvider } from './cashier-session-provider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: false,
      networkMode: 'always',
    },
  },
});

interface CashierProvidersProps {
  runtime: RuntimeConfig;
  session: AuthSession;
  authPort: AuthPort;
  router: RouterProviderProps['router'];
}

export function CashierProviders({ runtime, session, authPort, router }: CashierProvidersProps) {
  return (
    <RuntimeProvider config={runtime}>
      <ConnectivityProvider>
        <AuthProvider session={session} authPort={authPort}>
          <QueryClientProvider client={queryClient}>
            <ToastProvider>
              <CashierSessionProvider>
                <RouterProvider router={router} />
              </CashierSessionProvider>
            </ToastProvider>
          </QueryClientProvider>
        </AuthProvider>
      </ConnectivityProvider>
    </RuntimeProvider>
  );
}
