import { AuthProvider, type AuthPort, type AuthSession } from '@digvation/pos-auth';
import { RuntimeProvider, type RuntimeConfig } from '@digvation/pos-runtime';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { RouterProviderProps } from 'react-router';
import { RouterProvider } from 'react-router/dom';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: false,
    },
  },
});

interface CashierProvidersProps {
  runtime: RuntimeConfig;
  session: AuthSession;
  authPort: AuthPort;
  router: RouterProviderProps['router'];
}

export function CashierProviders({
  runtime,
  session,
  authPort,
  router,
}: CashierProvidersProps) {
  return (
    <RuntimeProvider config={runtime}>
      <AuthProvider session={session} authPort={authPort}>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </AuthProvider>
    </RuntimeProvider>
  );
}
