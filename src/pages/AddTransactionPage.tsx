import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState, type FormEvent } from 'react'
import { Save } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getAccounts } from '../db/repositories/accountRepository'
import { createTransaction, updateTransaction } from '../db/repositories/transactionRepository'
import { getCategories } from '../services/categoryService'
import { getSubcategories } from '../services/subcategoryService'
import type { Attachment, PaymentMode, Transaction, TransactionType } from '../types/transaction'

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

type Props = { transaction?: Transaction; onSaved?: () => void; onCancel?: () => void }

export function AddTransactionPage({ transaction, onSaved, onCancel }: Props) {
  const navigate = useNavigate()
  const accounts = useLiveQuery(getAccounts, [])
  const [transactionType, setTransactionType] = useState<TransactionType>(transaction?.type || 'expense')
  const [attachment, setAttachment] = useState<Attachment | undefined>(transaction?.attachment)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState(transaction?.category || '')
  const [subcategories, setSubcategories] = useState<string[]>([])
  const [selectedSubcategory, setSelectedSubcategory] = useState(transaction?.subcategory || '')
  const isTransfer = transactionType === 'transfer'

  useEffect(() => {
    getCategories(transactionType).then((availableCategories) => {
      setCategories(availableCategories)
      setSelectedCategory(transaction?.type === transactionType ? transaction.category : '')
    })
  }, [transactionType, transaction])

  useEffect(() => {
    getSubcategories(transactionType, selectedCategory).then((availableSubcategories) => {
      setSubcategories(availableSubcategories)
      setSelectedSubcategory(transaction?.type === transactionType && transaction.category === selectedCategory ? transaction.subcategory || '' : '')
    })
  }, [transactionType, selectedCategory, transaction])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const data = new FormData(event.currentTarget)
    const amount = Number(data.get('amount'))
    const category = isTransfer ? 'Transfer' : String(data.get('category') || '').trim()
    const subcategory = isTransfer ? undefined : String(data.get('subcategory') || '').trim() || undefined
    const defaultAccount = accounts?.find((account) => account.name === 'Cash') || accounts?.[0]
    const accountId = isTransfer ? Number(data.get('fromAccountId')) : (transaction?.accountId || defaultAccount?.id || 0)
    const fromAccountId = isTransfer ? accountId : undefined
    const toAccountId = isTransfer ? Number(data.get('toAccountId')) : undefined
    const date = String(data.get('date') || '')
    const time = String(data.get('time') || '')
    const note = String(data.get('note') || '').trim()
    const hashtags = parseHashtags(String(data.get('hashtags') || ''))
    const paymentMode = String(data.get('paymentMode') || 'cash') as PaymentMode

    if (!Number.isFinite(amount) || amount <= 0) { setError('Enter an amount greater than zero.'); return }
    if (!isTransfer && !category) { setError('Enter a category.'); return }
    if (!Number.isInteger(accountId) || accountId <= 0) { setError(isTransfer ? 'Choose the account to transfer from.' : 'Choose an account.'); return }
    if (isTransfer && (toAccountId === undefined || !Number.isInteger(toAccountId) || toAccountId <= 0)) { setError('Choose the account to transfer to.'); return }
    if (isTransfer && accountId === toAccountId) { setError('Choose two different accounts for the transfer.'); return }
    if (!date || !time) { setError('Choose both a date and time.'); return }
    if (!accounts?.some((account) => account.id === accountId) || (toAccountId && !accounts.some((account) => account.id === toAccountId))) { setError('Choose available accounts.'); return }

    setIsSaving(true)
    const now = new Date().toISOString()
    try {
      const values = { type: transactionType, amount, category, subcategory, accountId, fromAccountId, toAccountId, paymentMode, date, time, note, hashtags, attachment, createdAt: transaction?.createdAt || now, updatedAt: now }
      if (transaction?.id) await updateTransaction(transaction.id, values)
      else await createTransaction(values)
      if (onSaved) onSaved()
      else navigate('/')
    } catch { setError('The transaction could not be saved. Please try again.'); setIsSaving(false) }
  }

  function selectAttachment(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) setAttachment({ name: file.name, type: file.type, size: file.size })
  }

  const accountOptions = accounts?.map((account) => <option value={account.id} key={account.id}>{account.name}</option>)

  function preventImplicitSubmit(event: React.KeyboardEvent<HTMLFormElement>) {
    if (event.key !== 'Enter') return

    const target = event.target
    if (target instanceof HTMLInputElement) {
      event.preventDefault()
      if (target.name === 'hashtags') target.value = parseHashtags(target.value).join(' ')
      target.blur()
    } else if (target instanceof HTMLSelectElement) {
      event.preventDefault()
      target.blur()
    }
  }

  return <section className="add-transaction-page">
    <div className="page-heading"><div><p className="eyebrow">{transaction ? 'EDIT RECORD' : 'NEW RECORD'}</p><h2>{transaction ? 'Edit transaction' : 'Add transaction'}</h2><p>Record money in, money out, or a transfer.</p></div><button className="text-button" type="button" onClick={onCancel || (() => navigate('/'))}>Cancel</button></div>
    <form className="transaction-form" onSubmit={submit} onKeyDown={preventImplicitSubmit} noValidate>
      <fieldset><legend>Transaction type</legend><div className="type-picker">{transactionTypes.map((type) => <button className={transactionType === type ? 'type-option selected' : 'type-option'} type="button" key={type} onClick={() => setTransactionType(type)}>{type[0].toUpperCase() + type.slice(1)}</button>)}</div></fieldset>
      <div className="form-row"><label>Date<input name="date" type="date" defaultValue={transaction?.date || localDate()} required /></label><label>Time<input name="time" type="time" defaultValue={transaction?.time || localTime()} required /></label></div>
      <label>Amount<input name="amount" type="number" min="0.01" step="0.01" inputMode="decimal" defaultValue={transaction?.amount} placeholder="0.00" required /></label>
      {transactionType === 'transfer' ? <>
        <label>From<select name="fromAccountId" defaultValue={transaction?.fromAccountId || transaction?.accountId || ''} required><option value="" disabled>{accounts?.length ? 'Choose account' : 'Loading accounts...'}</option>{accountOptions}</select></label>
        <label>To<select name="toAccountId" defaultValue={transaction?.toAccountId || ''} required><option value="" disabled>{accounts?.length ? 'Choose account' : 'Loading accounts...'}</option>{accountOptions}</select></label>
      </> : <>
        <div className="category-field"><label>Category<select name="category" value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)} required><option value="" disabled>Choose category</option>{categories.map((category) => <option value={category} key={category}>{category}</option>)}</select></label></div>
        <div className="subcategory-field"><label>Subcategory <span className="optional">(optional)</span><select name="subcategory" value={selectedSubcategory} onChange={(event) => setSelectedSubcategory(event.target.value)} disabled={!selectedCategory}><option value="">No subcategory</option>{subcategories.map((subcategory) => <option value={subcategory} key={subcategory}>{subcategory}</option>)}</select></label></div>
        <label>Payment mode<select name="paymentMode" defaultValue={transaction?.paymentMode || 'cash'}>{paymentModes.map((mode) => <option value={mode} key={mode}>{mode.replace('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())}</option>)}</select></label>
      </>}
      <fieldset className="other-details"><legend>Other details</legend>
        <label>Note<textarea name="note" rows={3} defaultValue={transaction?.note} placeholder="Add a note (optional)" /></label>
        <label>Hashtags<input name="hashtags" defaultValue={transaction?.hashtags.join(' ')} placeholder="#work #travel (optional)" /></label>
        <label>Attachment <span className="optional">(optional)</span><input type="file" onChange={selectAttachment} /></label>
        {attachment && <p className="attachment-name">Attached: {attachment.name}</p>}
      </fieldset>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="save-transaction-button" type="submit" aria-label="Save transaction" title="Save transaction" disabled={isSaving || !accounts?.length}><Save size={20} aria-hidden="true" /></button>
    </form>
  </section>
}

