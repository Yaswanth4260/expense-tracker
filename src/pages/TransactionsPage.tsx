import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { getTransactions } from '../db/repositories/transactionRepository'
import { formatCurrency } from '../utils/formatCurrency'
import type { Transaction } from '../types/transaction'

function label(transaction: Transaction) { return transaction.note || transaction.category || 'Transaction' }

export function TransactionsPage() {
  const transactions = useLiveQuery(getTransactions, [])
  const allTransactions = transactions ?? []
  return <section className="transactions-page">
    <div className="page-heading"><div><p className="eyebrow">HISTORY</p><h2>All transactions</h2><p>Every transaction in one place.</p></div></div>
    {allTransactions.length ? <div className="transaction-list">{allTransactions.map((transaction) => <Link className="transaction-list-row" to={`/transactions/${transaction.id}`} key={transaction.id}><div><strong>{label(transaction)}</strong><span>{transaction.type} · {transaction.date} · {transaction.time}</span></div><strong>{transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}{formatCurrency(transaction.amount)}</strong></Link>)}</div> : <div className="dashboard-empty">No transactions yet.</div>}
  </section>
}
