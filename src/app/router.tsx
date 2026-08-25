import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import { AccountsPage, AddPage, AnalysisPage, BudgetPage, HomePage, SettingsPage, TransactionDetailsPage, TransactionsPage } from '../pages/PlaceholderPages'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'add', element: <AddPage /> },
      { path: 'transactions', element: <TransactionsPage /> },
      { path: 'transactions/:id', element: <TransactionDetailsPage /> },
      { path: 'analysis', element: <AnalysisPage /> },
      { path: 'accounts', element: <AccountsPage /> },
      { path: 'budget', element: <BudgetPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
])
