import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, CalendarDays, Clock3, FileText, Hash, Paperclip, Save, Tags, Trash2, WalletCards, X } from 'lucide-react'
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

type Props = { transaction?: Transaction; onSaved?: () => void; onCancel?: () => void; onDelete?: () => void }

export function AddTransactionPage({ transaction, onSaved, onCancel, onDelete }: Props) {
  const navigate = useNavigate()
  const accounts = useLiveQuery(getAccounts, [])
  const [transactionType, setTransactionType] = useState<TransactionType>(transaction?.type || 'expense')
  const [attachment, setAttachment] = useState<Attachment | undefined>(transaction?.attachment)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState(transaction?.category || 'Other')
  const [subcategories, setSubcategories] = useState<string[]>([])
  const [selectedSubcategory, setSelectedSubcategory] = useState(transaction?.subcategory || 'Other')
  const [selectionSheet, setSelectionSheet] = useState<'category' | 'subcategory' | 'payment' | null>(null)
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<PaymentMode>(transaction?.paymentMode || 'cash')
  const isTransfer = transactionType === 'transfer'

  useEffect(() => {
    getCategories(transactionType).then((availableCategories) => {
      setCategories(availableCategories)
      setSelectedCategory(transaction?.type === transactionType ? transaction.category : 'Other')
    })
  }, [transactionType, transaction])

  useEffect(() => {
    getSubcategories(transactionType, selectedCategory).then((availableSubcategories) => {
      setSubcategories(availableSubcategories)
      setSelectedSubcategory(transaction?.type === transactionType && transaction.category === selectedCategory ? transaction.subcategory || 'Other' : 'Other')
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
    if (!isTransfer && !category) { setError('Choose a category.'); return }
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
    <header className={`transaction-form-heading ${transaction ? 'edit-transaction-heading' : ''}`}><button className="back-button" type="button" onClick={onCancel || (() => navigate(transaction ? '/transactions' : '/'))} aria-label="Go back"><ArrowLeft size={20} /></button><h2>{transaction ? 'Edit transaction' : 'Add Transaction'}</h2>{transaction ? <button className="delete-transaction-button" type="button" onClick={onDelete} aria-label="Delete transaction" title="Delete transaction"><Trash2 size={19} /></button> : <span className="transaction-header-spacer" aria-hidden="true" />}</header>
    <form className="transaction-form" onSubmit={submit} onKeyDown={preventImplicitSubmit} noValidate>
      <fieldset><legend className="visually-hidden">Transaction type</legend><div className="type-picker">{transactionTypes.map((type) => <button className={transactionType === type ? 'type-option selected' : 'type-option'} type="button" key={type} onClick={() => setTransactionType(type)}>{type[0].toUpperCase() + type.slice(1)}</button>)}</div></fieldset>
      <div className="form-row"><label aria-label="Date"><span className="input-with-icon"><CalendarDays size={18} aria-hidden="true" /><input aria-label="Date" name="date" type="date" defaultValue={transaction?.date || localDate()} required /></span></label><label aria-label="Time"><span className="input-with-icon"><Clock3 size={18} aria-hidden="true" /><input aria-label="Time" name="time" type="time" defaultValue={transaction?.time || localTime()} required /></span></label></div>
      <label>Amount<span className="input-with-icon"><span className="currency-prefix" aria-hidden="true">₹</span><input name="amount" type="number" min="0.01" step="0.01" inputMode="decimal" defaultValue={transaction?.amount} placeholder="0" required /></span></label>
      {transactionType === 'transfer' ? <>
        <label>From<select name="fromAccountId" defaultValue={transaction?.fromAccountId || transaction?.accountId || ''} required><option value="" disabled>{accounts?.length ? 'Choose account' : 'Loading accounts...'}</option>{accountOptions}</select></label>
        <label>To<select name="toAccountId" defaultValue={transaction?.toAccountId || ''} required><option value="" disabled>{accounts?.length ? 'Choose account' : 'Loading accounts...'}</option>{accountOptions}</select></label>
      </> : <>
        <div className="transaction-category-row"><div className="category-field"><label>Category<span className="input-with-icon"><Tags size={18} aria-hidden="true" /><button aria-label="Category" className="selection-trigger" type="button" onClick={() => setSelectionSheet('category')} aria-haspopup="dialog" aria-expanded={selectionSheet === 'category'}>{selectedCategory || 'Other'}</button></span><input name="category" type="hidden" value={selectedCategory || 'Other'} /></label></div>
        <div className="subcategory-field"><label>Sub category<span className="input-with-icon"><Tags size={18} aria-hidden="true" /><button aria-label="Subcategory" className="selection-trigger" type="button" onClick={() => setSelectionSheet('subcategory')} aria-haspopup="dialog" aria-expanded={selectionSheet === 'subcategory'}>{selectedSubcategory || 'Other'}</button></span><input name="subcategory" type="hidden" value={selectedSubcategory || 'Other'} /></label></div></div>
        <label>Payment mode<span className="input-with-icon"><WalletCards size={18} aria-hidden="true" /><button className="selection-trigger" type="button" onClick={() => setSelectionSheet('payment')} aria-haspopup="dialog" aria-expanded={selectionSheet === 'payment'}>{selectedPaymentMode.replace('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())}</button></span><input name="paymentMode" type="hidden" value={selectedPaymentMode} /></label>
      </>}
      <fieldset className="other-details"><legend>Other details</legend>
        <label aria-label="Note"><span className="input-with-icon input-with-icon-top"><FileText size={18} aria-hidden="true" /><textarea aria-label="Note" name="note" rows={3} defaultValue={transaction?.note} placeholder="Write a note" /></span></label>
        <label aria-label="Hashtags"><span className="input-with-icon"><Hash size={20} aria-hidden="true" /><input aria-label="Hashtags" name="hashtags" defaultValue={transaction?.hashtags.join(' ')} placeholder="Add tags" /></span></label>
        <label aria-label="Attachment"><span className="attachment-picker"><Paperclip size={18} aria-hidden="true" /><span>{attachment?.name || 'Add attachment'}</span><input type="file" aria-label="Add attachment" onChange={selectAttachment} /></span></label>
        {attachment && <p className="attachment-name">Attached: {attachment.name}</p>}
      </fieldset>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="save-transaction-button" type="submit" aria-label="Save transaction" title="Save transaction" disabled={isSaving || !accounts?.length}><Save size={20} aria-hidden="true" /></button>
    </form>
    {selectionSheet && <div className="transaction-selection-backdrop" onClick={() => setSelectionSheet(null)} aria-hidden="true" />}
    {selectionSheet && <div className="transaction-selection-sheet" role="dialog" aria-modal="true" aria-labelledby="transaction-selection-title">
      <div className="transactions-sheet-handle" aria-hidden="true" />
      <div className="transactions-sheet-header"><div><strong id="transaction-selection-title">Choose {selectionSheet === 'payment' ? 'payment mode' : selectionSheet}</strong><span>Select an option for this transaction.</span></div><button className="transactions-sheet-close" type="button" onClick={() => setSelectionSheet(null)} aria-label="Close selection"><X size={19} /></button></div>
      <div className="transaction-selection-grid">{(selectionSheet === 'category' ? categories : selectionSheet === 'subcategory' ? ['Other', ...subcategories.filter((subcategory) => subcategory !== 'Other')] : paymentModes).map((option) => <button className={(selectionSheet === 'category' ? selectedCategory : selectionSheet === 'subcategory' ? selectedSubcategory : selectedPaymentMode) === option ? 'selected' : ''} type="button" key={option} onClick={() => { if (selectionSheet === 'category') { setSelectedCategory(option); setSelectedSubcategory('Other') } else if (selectionSheet === 'subcategory') setSelectedSubcategory(option); else setSelectedPaymentMode(option as PaymentMode); setSelectionSheet(null) }}>{option.replace('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())}</button>)}</div>
    </div>}
  </section>
}

