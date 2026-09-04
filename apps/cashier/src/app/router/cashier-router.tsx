import { Navigate, createBrowserRouter } from 'react-router';

import { AccountPage } from '../../routes/account/account-page';
import { LoginPage } from '../../routes/login/login-page';
import { OpenSalesPage } from '../../routes/open-sales/open-sales-page';
import { SellPage } from '../../routes/sell/sell-page';
import { CashierAuthGate } from './cashier-auth-gate';

export const cashierRouter = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <CashierAuthGate />,
    children: [
      { index: true, element: <Navigate to="/sell" replace /> },
      { path: '/sell', element: <SellPage /> },
      { path: '/sell/:saleId', element: <SellPage /> },
      { path: '/open-sales', element: <OpenSalesPage /> },
      { path: '/account', element: <AccountPage /> },
    ],
  },
]);
