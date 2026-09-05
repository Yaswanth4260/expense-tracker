import { useLiveQuery } from 'dexie-react-hooks'
import { useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { getBudgets } from '../db/repositories/budgetRepository'
import { getTransactions } from '../db/repositories/transactionRepository'
import { Card, EmptyState, PrimaryButton, SectionHeader, SegmentedControl } from '../components/ui'
import type { BudgetType } from '../types/budget'
import { getNetBalance, getRecentTransactions, getTotalExpense, getTotalIncome } from '../utils/dashboardCalculations'
import { formatCurrency } from '../utils/formatCurrency'
import { formatTime } from '../utils/formatTime'
import { useGreeting } from '../hooks/useGreeting'
import { getCategoryIconKey } from '../services/categoryService'
import { getCategoryIcon } from '../utils/categoryIcons'

const monthFormatter = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' })
const todayFormatter = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

function localPeriod() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function HomePage() {
  const navigate = useNavigate()
  const transactions = useLiveQuery(getTransactions, []) ?? []
  const budgets = useLiveQuery(getBudgets, []) ?? []
  const [budgetType, setBudgetType] = useState<BudgetType>('monthly')
  const [period, setPeriod] = useState<'month' | 'all'>('month')
  const [figureAwake, setFigureAwake] = useState(false)
  const figureTimeout = useRef<number | undefined>(undefined)
  const greeting = useGreeting()

  const currentPeriod = localPeriod()
  const selectedTransactions = period === 'month' ? transactions.filter((transaction) => transaction.date.startsWith(currentPeriod)) : transactions
  const spending = getTotalExpense(selectedTransactions)
  const income = getTotalIncome(selectedTransactions)
  const balance = getNetBalance(selectedTransactions)
  const recentTransactions = getRecentTransactions(transactions)
  const selectedBudget = budgets.find((budget) => budget.type === budgetType && budget.period === (budgetType === 'monthly' ? currentPeriod : currentPeriod.slice(0, 4)))

  function wakeFigure() {
    setFigureAwake(true)
    if (figureTimeout.current) window.clearTimeout(figureTimeout.current)
    figureTimeout.current = window.setTimeout(() => setFigureAwake(false), 3500)
  }

  return <section className="home-dashboard">
    <header className="home-greeting">
      <div className="home-greeting-mark" aria-hidden="true"><span /></div>
      <div className="home-greeting-copy">
        <p className="home-greeting-date">{todayFormatter.format(new Date())}</p>
        <h2>{greeting.phrase || 'Hey! 👋'}</h2>
        <p className="home-greeting-note">Your money, your rhythm.</p>
      </div>
      {/* The figure mirrors the local time period: it runs in the morning, exercises during the day, and sleeps at night. Clicking or tapping the full scene wakes it for 3.5 seconds; the button label and focus state keep the interaction keyboard-accessible. */}
      <button className={`home-greeting-activity ${greeting.period} ${figureAwake ? 'awake' : ''}`} type="button" aria-label={`Wake the ${greeting.period} activity`} onClick={wakeFigure}>
        <div className="motion-figure" aria-hidden="true">
          <span className="motion-head" />
          <span className="motion-body" />
          <span className="motion-arm motion-arm-left" />
          <span className="motion-arm motion-arm-right" />
          <span className="motion-leg motion-leg-left" />
          <span className="motion-leg motion-leg-right" />
        </div>
      </button>
    </header>
    <Card className="cash-flow-card"><div className="cash-flow-heading"><div><p className="ui-eyebrow">CASH FLOW</p><h3>{period === 'month' ? monthFormatter.format(new Date()) : 'All time'}</h3></div><select aria-label="Cash flow period" value={period} onChange={(event) => setPeriod(event.target.value as 'month' | 'all')}><option value="month">This Month</option><option value="all">All Time</option></select></div><div className="flow-columns"><div><span className="flow-label spending-label">SPENDING</span><strong>{formatCurrency(spending)}</strong></div><div><span className="flow-label income-label">INCOME</span><strong>{formatCurrency(income)}</strong></div></div><div className="net-balance"><span>Net balance</span><strong>{formatCurrency(balance)}</strong></div></Card>
    <section className="dashboard-section"><SectionHeader title="Recent transactions" action={<Link className="section-button" to="/transactions">See all</Link>} />{recentTransactions.length ? <Card className="recent-card">{recentTransactions.map((transaction) => { const CategoryIcon = getCategoryIcon(getCategoryIconKey(transaction.type, transaction.category)); return <Link className="recent-row" to={`/transactions/${transaction.id}`} key={transaction.id}><span className={`transaction-icon category-icon ${transaction.type === 'income' ? 'income' : ''}`}><CategoryIcon size={19} /></span><span className="recent-copy"><strong>{transaction.subcategory || transaction.category}</strong><span>{transaction.paymentMode.replace('-', ' ')}</span></span><span className="recent-amount"><strong className={transaction.type === 'income' ? 'income-amount' : transaction.type === 'expense' ? 'expense-amount' : 'transfer-amount'}>{formatCurrency(transaction.amount)}</strong><span>{formatTime(transaction.time)}</span></span></Link> })}</Card> : <EmptyState title="No transactions yet" description="Add your first transaction to see it here." action={<PrimaryButton onClick={() => window.location.assign('/expense-tracker/add')}><Plus size={16} /> Add transaction</PrimaryButton>} />}</section>
    <section className="dashboard-section"><SectionHeader title="Budgets" /><Card className="budget-card"><SegmentedControl value={budgetType} onChange={setBudgetType} label="Budget period" options={[{ value: 'monthly', label: 'Monthly' }, { value: 'annual', label: 'Annual' }]} />{selectedBudget ? <div className="budget-set-state"><p className="ui-eyebrow">{budgetType === 'monthly' ? 'THIS MONTH' : 'THIS YEAR'}</p><h3>{formatCurrency(selectedBudget.amount)}</h3><p>Budget is set for this period.</p>
      <PrimaryButton onClick={() => navigate('/budget')}>Update budget</PrimaryButton></div> : <EmptyState title="No budget set" description={`Create a ${budgetType} budget to keep your spending on track.`} action={<PrimaryButton onClick={() => navigate('/budget')}
      ><Plus size={16} /> Set budget</PrimaryButton>} />}</Card></section>
  </section>
}
