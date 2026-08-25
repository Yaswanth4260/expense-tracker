import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import { AccountsPage, AnalysisPage, BudgetPage, SettingsPage, TransactionDetailsPage, TransactionsPage } from '../pages/PlaceholderPages'
import { AddTransactionPage } from '../pages/AddTransactionPage'
import { HomePage } from '../pages/HomePage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'add', element: <AddTransactionPage /> },
      { path: 'transactions', element: <TransactionsPage /> },
      { path: 'transactions/:id', element: <TransactionDetailsPage /> },
      { path: 'analysis', element: <AnalysisPage /> },
      { path: 'accounts', element: <AccountsPage /> },
      { path: 'budget', element: <BudgetPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
])
