import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import { AnalysisPage, SettingsPage } from '../pages/PlaceholderPages'
import { AddTransactionPage } from '../pages/AddTransactionPage'
import { AccountsPage } from '../pages/AccountsPage'
import { BudgetPage } from '../pages/BudgetPage'
import { HomePage } from '../pages/HomePage'
import { TransactionDetailsPage } from '../pages/TransactionDetailsPage'
import { TransactionsPage } from '../pages/TransactionsPage'

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
