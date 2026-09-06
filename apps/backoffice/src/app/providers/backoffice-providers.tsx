import { RuntimeProvider, type RuntimeConfig } from '@digvation/pos-runtime';
import { DToastProvider as ToastProvider } from '@digvation-labs/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { RouterProviderProps } from 'react-router';
import { RouterProvider } from 'react-router/dom';

import { BackofficeAuthProvider } from '../../auth/backoffice-auth-context';
import type { HttpAuthAdapter } from '../../auth/http-auth-adapter';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: true },
    mutations: { retry: false },
  },
});

interface BackofficeProvidersProps {
  runtime: RuntimeConfig;
  auth: HttpAuthAdapter;
  router: RouterProviderProps['router'];
}

export function BackofficeProviders({ runtime, auth, router }: BackofficeProvidersProps) {
  return (
    <RuntimeProvider config={runtime}>
      <BackofficeAuthProvider auth={auth}>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <RouterProvider router={router} />
          </ToastProvider>
        </QueryClientProvider>
      </BackofficeAuthProvider>
    </RuntimeProvider>
  );
}
