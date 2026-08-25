import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowDownLeft, ArrowUpRight, Plus, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getAccounts } from '../db/repositories/accountRepository'
import { getTransactions } from '../db/repositories/transactionRepository'
import { formatCurrency } from '../utils/formatCurrency'
import { getNetBalance, getRecentTransactions, getTotalExpense, getTotalIncome } from '../utils/dashboardCalculations'
import type { Transaction } from '../types/transaction'

function transactionLabel(transaction: Transaction) {
  return transaction.note || transaction.category || 'Untitled transaction'
}

export function HomePage() {
  const transactions = useLiveQuery(getTransactions, [])
  const accounts = useLiveQuery(getAccounts, [])
  const allTransactions = transactions ?? []
  const accountNames = new Map((accounts ?? []).map((account) => [account.id, account.name]))
  const recentTransactions = getRecentTransactions(allTransactions)
  const income = getTotalIncome(allTransactions)
  const expense = getTotalExpense(allTransactions)
  const balance = getNetBalance(allTransactions)

  return <section className="dashboard-page">
    <div className="dashboard-heading"><div><p className="eyebrow">OVERVIEW</p><h2>Good to see you.</h2><p>Your financial snapshot at a glance.</p></div><Link className="header-add" to="/add" aria-label="Add transaction"><Plus size={20} /></Link></div>
    <section className="balance-card"><span>Total balance</span><strong>{formatCurrency(balance)}</strong><small>Income less expenses · transfers excluded</small></section>
    <section className="summary-grid"><div><span>Total income</span><strong>{formatCurrency(income)}</strong></div><div><span>Total expense</span><strong>{formatCurrency(expense)}</strong></div></section>
    <section className="dashboard-section"><div className="section-title-row"><h3>Recent transactions</h3><Link to="/transactions">See all</Link></div>{recentTransactions.length ? <div className="dashboard-transactions">{recentTransactions.map((transaction) => <Link className="dashboard-transaction" to={`/transactions/${transaction.id}`} key={transaction.id}><span className={transaction.type === 'income' ? 'transaction-icon income' : 'transaction-icon'}>{transaction.type === 'income' ? <ArrowDownLeft size={18} /> : transaction.type === 'expense' ? <ArrowUpRight size={18} /> : <RefreshCw size={18} />}</span><span className="transaction-copy"><strong>{transactionLabel(transaction)}</strong><small>{accountNames.get(transaction.accountId) || 'Account'} · {transaction.date}</small></span><strong className={transaction.type === 'income' ? 'income-value' : 'expense-value'}>{transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}</strong></Link>)}</div> : <div className="dashboard-empty">No transactions yet. Add your first one to begin.</div>}</section>
  </section>
}
