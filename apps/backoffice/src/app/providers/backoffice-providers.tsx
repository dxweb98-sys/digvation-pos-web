import { AuthProvider, type AuthPort, type AuthSession } from '@digvation/pos-auth';
import { RuntimeProvider, type RuntimeConfig } from '@digvation/pos-runtime';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { RouterProviderProps } from 'react-router';
import { RouterProvider } from 'react-router/dom';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: true },
    mutations: { retry: false },
  },
});

interface BackofficeProvidersProps {
  runtime: RuntimeConfig;
  session: AuthSession | null;
  authPort: AuthPort;
  router: RouterProviderProps['router'];
}

export function BackofficeProviders({
  runtime,
  session,
  authPort,
  router,
}: BackofficeProvidersProps) {
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
