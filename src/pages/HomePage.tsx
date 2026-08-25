import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Mic, Plus, Search, WalletCards } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getAccounts } from '../db/repositories/accountRepository'
import { createBudget, getBudgets, updateBudget } from '../db/repositories/budgetRepository'
import { getTransactions } from '../db/repositories/transactionRepository'
import { Card, EmptyState, IconButton, PageHeader, PrimaryButton, SectionHeader, SegmentedControl } from '../components/ui'
import type { BudgetType } from '../types/budget'
import type { Transaction } from '../types/transaction'
import { getNetBalance, getRecentTransactions, getTotalExpense, getTotalIncome } from '../utils/dashboardCalculations'
import { formatCurrency } from '../utils/formatCurrency'

const monthFormatter = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' })
const dateFormatter = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' })

function localPeriod() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function transactionLabel(transaction: Transaction) {
  return transaction.note || transaction.category || 'Untitled transaction'
}

function transactionIcon(transaction: Transaction) {
  if (transaction.type === 'income') return <ArrowDownLeft size={19} />
  if (transaction.type === 'transfer') return <WalletCards size={19} />
  return <ArrowUpRight size={19} />
}

export function HomePage() {
  const transactions = useLiveQuery(getTransactions, []) ?? []
  const accounts = useLiveQuery(getAccounts, []) ?? []
  const budgets = useLiveQuery(getBudgets, []) ?? []
  const [budgetType, setBudgetType] = useState<BudgetType>('monthly')
  const [period, setPeriod] = useState<'month' | 'all'>('month')

  const accountNames = new Map(accounts.map((account) => [account.id, account.name]))
  const currentPeriod = localPeriod()
  const selectedTransactions = period === 'month' ? transactions.filter((transaction) => transaction.date.startsWith(currentPeriod)) : transactions
  const spending = getTotalExpense(selectedTransactions)
  const income = getTotalIncome(selectedTransactions)
  const balance = getNetBalance(selectedTransactions)
  const recentTransactions = getRecentTransactions(transactions)
  const selectedBudget = budgets.find((budget) => budget.type === budgetType && budget.period === (budgetType === 'monthly' ? currentPeriod : currentPeriod.slice(0, 4)))

  async function setBudget() {
    const value = window.prompt(`${budgetType === 'monthly' ? 'Monthly' : 'Annual'} budget in INR`, selectedBudget?.amount.toString() || '')
    const amount = Number(value)
    if (!Number.isFinite(amount) || amount <= 0) return
    const now = new Date().toISOString()
    if (selectedBudget?.id) await updateBudget(selectedBudget.id, { amount, updatedAt: now })
    else await createBudget({ type: budgetType, period: budgetType === 'monthly' ? currentPeriod : currentPeriod.slice(0, 4), amount, createdAt: now, updatedAt: now })
  }

  return <section className="home-dashboard">
    <PageHeader eyebrow="PERSONAL FINANCE" title="Good morning" description="Your money, organized simply." action={<div className="dashboard-actions"><IconButton label="Voice input"><Mic size={19} /></IconButton><IconButton label="Search"><Search size={19} /></IconButton></div>} />
    <div className="profile-strip"><div className="user-avatar" aria-hidden="true">GU</div><span>Guest User</span><button className="upgrade-pill" type="button">Upgrade to Pro</button></div>
    <Card className="cash-flow-card"><div className="cash-flow-heading"><div><p className="ui-eyebrow">CASH FLOW</p><h3>{period === 'month' ? monthFormatter.format(new Date()) : 'All time'}</h3></div><select aria-label="Cash flow period" value={period} onChange={(event) => setPeriod(event.target.value as 'month' | 'all')}><option value="month">This Month</option><option value="all">All Time</option></select></div><div className="flow-columns"><div><span className="flow-label spending-label">SPENDING</span><strong>{formatCurrency(spending)}</strong></div><div><span className="flow-label income-label">INCOME</span><strong>{formatCurrency(income)}</strong></div></div><div className="net-balance"><span>Net balance</span><strong>{formatCurrency(balance)}</strong></div></Card>
    <section className="dashboard-section"><SectionHeader title="Recent transactions" action={<Link className="section-link" to="/transactions">See all</Link>} />{recentTransactions.length ? <Card className="recent-card">{recentTransactions.map((transaction) => <Link className="recent-row" to={`/transactions/${transaction.id}`} key={transaction.id}><span className={transaction.type === 'income' ? 'transaction-icon income' : 'transaction-icon'}>{transactionIcon(transaction)}</span><span className="recent-copy"><strong>{transactionLabel(transaction)}</strong><span>{accountNames.get(transaction.accountId) || 'Account'} · {dateFormatter.format(new Date(`${transaction.date}T12:00:00`))}</span></span><span className="recent-amount"><strong className={transaction.type === 'income' ? 'income-amount' : 'expense-amount'}>{transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}{formatCurrency(transaction.amount)}</strong><span>{transaction.time}</span></span></Link>)}</Card> : <EmptyState title="No transactions yet" description="Add your first transaction to see it here." action={<PrimaryButton onClick={() => window.location.assign('/add')}><Plus size={16} /> Add transaction</PrimaryButton>} />}</section>
    <section className="dashboard-section"><SectionHeader title="Budgets" /><Card className="budget-card"><SegmentedControl value={budgetType} onChange={setBudgetType} label="Budget period" options={[{ value: 'monthly', label: 'Monthly' }, { value: 'annual', label: 'Annual' }]} />{selectedBudget ? <div className="budget-set-state"><p className="ui-eyebrow">{budgetType === 'monthly' ? 'THIS MONTH' : 'THIS YEAR'}</p><h3>{formatCurrency(selectedBudget.amount)}</h3><p>Budget is set for this period.</p><PrimaryButton onClick={setBudget}>Update budget</PrimaryButton></div> : <EmptyState title="No budget set" description={`Create a ${budgetType} budget to keep your spending on track.`} action={<PrimaryButton onClick={setBudget}><Plus size={16} /> Set budget</PrimaryButton>} />}</Card></section>
  </section>
}
