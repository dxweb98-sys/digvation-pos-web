import { Navigate, createBrowserRouter } from 'react-router';

import { AccountPage } from '../../routes/account/account-page';
import { OperationsHomePage } from '../../routes/operations-home/operations-home-page';
import { BackofficeShell } from '../shell/backoffice-shell';

export const backofficeRouter = createBrowserRouter([
  {
    element: <BackofficeShell />,
    children: [
      { index: true, element: <Navigate to="/operations" replace /> },
      { path: '/operations', element: <OperationsHomePage /> },
      { path: '/account', element: <AccountPage /> },
    ],
  },
]);
