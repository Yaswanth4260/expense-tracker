import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import { SettingsPage } from '../pages/SettingsPage'
import { AddTransactionPage } from '../pages/AddTransactionPage'
import { AccountsPage } from '../pages/AccountsPage'
import { AnalysisPage } from '../pages/AnalysisPage'
import { BudgetPage } from '../pages/BudgetPage'
import { HomePage } from '../pages/HomePage'
import { TransactionDetailsPage } from '../pages/TransactionDetailsPage'
import { TransactionsPage } from '../pages/TransactionsPage'
import { CategoriesPage } from '../pages/CategoriesPage'

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
      { path: 'settings/categories', element: <CategoriesPage /> },
    ],
  },
],
  {
    basename: import.meta.env.BASE_URL,
  },
)
