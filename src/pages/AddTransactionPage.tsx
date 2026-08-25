import { useLiveQuery } from 'dexie-react-hooks'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAccounts } from '../db/repositories/accountRepository'
import { createTransaction } from '../db/repositories/transactionRepository'
import type { Attachment, PaymentMode, TransactionType } from '../types/transaction'

const transactionTypes: TransactionType[] = ['expense', 'income', 'transfer']
const paymentModes: PaymentMode[] = ['cash', 'upi', 'card', 'net-banking', 'other']

function localDate() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function localTime() {
  const date = new Date()
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function parseHashtags(value: string) {
  return value.split(/[\s,]+/).map((tag) => tag.trim().replace(/^#/, '')).filter(Boolean).map((tag) => `#${tag}`)
}

export function AddTransactionPage() {
  const navigate = useNavigate()
  const accounts = useLiveQuery(getAccounts, [])
  const [transactionType, setTransactionType] = useState<TransactionType>('expense')
  const [attachment, setAttachment] = useState<Attachment>()
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const data = new FormData(event.currentTarget)
    const amount = Number(data.get('amount'))
    const category = String(data.get('category') || '').trim()
    const accountId = Number(data.get('accountId'))
    const date = String(data.get('date') || '')
    const time = String(data.get('time') || '')
    const note = String(data.get('note') || '').trim()
    const hashtags = parseHashtags(String(data.get('hashtags') || ''))
    const paymentMode = String(data.get('paymentMode') || 'cash') as PaymentMode

    if (!Number.isFinite(amount) || amount <= 0) { setError('Enter an amount greater than zero.'); return }
    if (!category) { setError('Enter a category.'); return }
    if (!Number.isInteger(accountId) || accountId <= 0) { setError('Choose an account.'); return }
    if (!date || !time) { setError('Choose both a date and time.'); return }
    if (!accounts?.some((account) => account.id === accountId)) { setError('Choose an available account.'); return }

    setIsSaving(true)
    const now = new Date().toISOString()
    try {
      await createTransaction({ type: transactionType, amount, category, accountId, paymentMode, date, time, note, hashtags, attachment, createdAt: now, updatedAt: now })
      navigate('/')
    } catch { setError('The transaction could not be saved. Please try again.'); setIsSaving(false) }
  }

  function selectAttachment(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) setAttachment({ name: file.name, type: file.type, size: file.size })
  }

  return <section className="add-transaction-page">
    <div className="page-heading"><div><p className="eyebrow">NEW RECORD</p><h2>Add transaction</h2><p>Record money in, money out, or a transfer.</p></div><button className="text-button" type="button" onClick={() => navigate('/')}>Cancel</button></div>
    <form className="transaction-form" onSubmit={submit} noValidate>
      <fieldset><legend>Transaction type</legend><div className="type-picker">{transactionTypes.map((type) => <button className={transactionType === type ? 'type-option selected' : 'type-option'} type="button" key={type} onClick={() => setTransactionType(type)}>{type[0].toUpperCase() + type.slice(1)}</button>)}</div></fieldset>
      <label>Amount<input name="amount" type="number" min="0.01" step="0.01" inputMode="decimal" placeholder="0.00" required /></label>
      <div className="form-row"><label>Category<input name="category" placeholder="Food, salary, rent..." required /></label><label>Account<select name="accountId" defaultValue="" required><option value="" disabled>{accounts?.length ? 'Choose account' : 'Loading accounts...'}</option>{accounts?.map((account) => <option value={account.id} key={account.id}>{account.name}</option>)}</select></label></div>
      <div className="form-row"><label>Date<input name="date" type="date" defaultValue={localDate()} required /></label><label>Time<input name="time" type="time" defaultValue={localTime()} required /></label></div>
      <label>Payment mode<select name="paymentMode" defaultValue="cash">{paymentModes.map((mode) => <option value={mode} key={mode}>{mode.replace('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())}</option>)}</select></label>
      <label>Note<textarea name="note" rows={3} placeholder="Add a note (optional)" /></label>
      <label>Hashtags<input name="hashtags" placeholder="#work #travel (optional)" /></label>
      <label>Attachment <span className="optional">(optional)</span><input type="file" onChange={selectAttachment} /></label>
      {attachment && <p className="attachment-name">Attached: {attachment.name}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="primary-button" type="submit" disabled={isSaving || !accounts?.length}>{isSaving ? 'Saving...' : 'Save transaction'}</button>
    </form>
  </section>
}
