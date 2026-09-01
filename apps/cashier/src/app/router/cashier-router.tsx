import { Navigate, createBrowserRouter } from 'react-router';

import { AccountPage } from '../../routes/account/account-page';
import { SellFoundationPage } from '../../routes/sell/sell-foundation-page';
import { CashierShell } from '../shell/cashier-shell';

export const cashierRouter = createBrowserRouter([
  {
    element: <CashierShell />,
    children: [
      { index: true, element: <Navigate to="/sell" replace /> },
      { path: '/sell', element: <SellFoundationPage /> },
      { path: '/account', element: <AccountPage /> },
    ],
  },
]);
