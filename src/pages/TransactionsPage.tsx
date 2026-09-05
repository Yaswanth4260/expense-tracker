import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { getTransactions } from '../db/repositories/transactionRepository'
import { formatCurrency } from '../utils/formatCurrency'
import type { Transaction } from '../types/transaction'
import { formatTime } from '../utils/formatTime'
import { getCategoryIconKey } from '../services/categoryService'
import { getCategoryIcon } from '../utils/categoryIcons'

function dateLabel(date: string) {
  const today = new Date()
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`
  if (date === todayKey) return 'Today'
  if (date === yesterdayKey) return 'Yesterday'
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(`${date}T12:00:00`))
}

export function TransactionsPage() {
  const transactions = useLiveQuery(getTransactions, [])
  const allTransactions = transactions ?? []
  const groupedTransactions = allTransactions.reduce<Record<string, Transaction[]>>((groups, transaction) => {
    ;(groups[transaction.date] ||= []).push(transaction)
    return groups
  }, {})
  return <section className="transactions-page">
    <div className="page-heading"><div><p className="eyebrow">HISTORY</p><h2>All transactions</h2><p>Every transaction in one place.</p></div></div>
    {allTransactions.length ? <div className="transaction-day-list">{Object.entries(groupedTransactions).map(([date, dayTransactions]) => <section className="transaction-day-card" key={date}><h3>{dateLabel(date)}</h3><div className="transaction-day-rows">{dayTransactions.map((transaction) => { const CategoryIcon = getCategoryIcon(getCategoryIconKey(transaction.type, transaction.category)); return <Link className="all-transaction-row" to={`/transactions/${transaction.id}`} key={transaction.id}><span className={`transaction-icon category-icon ${transaction.type === 'income' ? 'income' : ''}`}><CategoryIcon size={19} /></span><span className="recent-copy"><strong>{transaction.subcategory || transaction.category}</strong><span>{transaction.paymentMode.replace('-', ' ')}</span></span><span className="recent-amount"><strong className={transaction.type === 'income' ? 'income-amount' : transaction.type === 'expense' ? 'expense-amount' : 'transfer-amount'}>{formatCurrency(transaction.amount)}</strong><span>{formatTime(transaction.time)}</span></span></Link> })}</div></section>)}</div> : <div className="dashboard-empty">No transactions yet.</div>}
  </section>
}
