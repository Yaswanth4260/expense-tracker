import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deleteTransaction, getTransaction } from '../db/repositories/transactionRepository'
import { AddTransactionPage } from './AddTransactionPage'

export function TransactionDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const transactionId = Number(id)
  const transaction = useLiveQuery(() => Number.isInteger(transactionId) ? getTransaction(transactionId) : undefined, [transactionId])

  if (transaction === undefined) return <section className="placeholder-page"><h2>Loading transaction...</h2></section>
  if (!transaction) return <section className="placeholder-page"><h2>Transaction not found</h2><Link to="/transactions">Back to transactions</Link></section>
  async function remove() { if (window.confirm('Delete this transaction?')) { await deleteTransaction(transactionId); navigate('/transactions') } }

  return <AddTransactionPage transaction={transaction} onSaved={() => navigate('/transactions')} onCancel={() => navigate('/transactions')} onDelete={remove} />
}
