import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getAccounts } from '../db/repositories/accountRepository'
import { deleteTransaction, getTransaction } from '../db/repositories/transactionRepository'
import { AddTransactionPage } from './AddTransactionPage'
import { formatCurrency } from '../utils/formatCurrency'

export function TransactionDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const transactionId = Number(id)
  const transaction = useLiveQuery(() => Number.isInteger(transactionId) ? getTransaction(transactionId) : undefined, [transactionId])
  const accounts = useLiveQuery(getAccounts, [])
  const [editing, setEditing] = useState(false)

  if (transaction === undefined) return <section className="placeholder-page"><h2>Loading transaction...</h2></section>
  if (!transaction) return <section className="placeholder-page"><h2>Transaction not found</h2><Link to="/transactions">Back to transactions</Link></section>
  if (editing) return <AddTransactionPage transaction={transaction} onSaved={() => setEditing(false)} onCancel={() => setEditing(false)} />

  const accountName = accounts?.find((account) => account.id === transaction.accountId)?.name || 'Unknown account'
  const fromAccountName = accounts?.find((account) => account.id === (transaction.fromAccountId || transaction.accountId))?.name || 'Unknown account'
  const toAccountName = accounts?.find((account) => account.id === transaction.toAccountId)?.name || 'Unknown account'
  async function remove() { if (window.confirm('Delete this transaction?')) { await deleteTransaction(transactionId); navigate('/transactions') } }

  return <section className="transaction-details-page"><div className="page-heading"><div><p className="eyebrow">TRANSACTION DETAILS</p><h2>{transaction.note || transaction.category}</h2><p>{transaction.date} at {transaction.time}</p></div><Link className="text-button" to="/transactions">Back</Link></div><div className="detail-card"><div className="detail-amount"><span>{transaction.type}</span><strong>{formatCurrency(transaction.amount)}</strong></div><dl>{transaction.type === 'transfer' ? <><div><dt>From</dt><dd>{fromAccountName}</dd></div><div><dt>To</dt><dd>{toAccountName}</dd></div></> : <><div><dt>Category</dt><dd>{transaction.category}</dd></div><div><dt>Subcategory</dt><dd>{transaction.subcategory || '—'}</dd></div><div><dt>Account</dt><dd>{accountName}</dd></div><div><dt>Payment mode</dt><dd>{transaction.paymentMode}</dd></div></>}<div><dt>Note</dt><dd>{transaction.note || '—'}</dd></div><div><dt>Hashtags</dt><dd>{transaction.hashtags.length ? transaction.hashtags.join(' ') : '—'}</dd></div><div><dt>Attachment</dt><dd>{transaction.attachment?.name || '—'}</dd></div></dl><div className="detail-actions"><button className="primary-button" onClick={() => setEditing(true)}>Edit transaction</button><button className="text-button danger-button" onClick={remove}>Delete transaction</button></div></div></section>
}
