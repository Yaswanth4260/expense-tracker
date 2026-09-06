import { useLiveQuery } from 'dexie-react-hooks'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getTransactions } from '../db/repositories/transactionRepository'
import { formatCurrency } from '../utils/formatCurrency'
import type { Transaction, TransactionType } from '../types/transaction'
import { useAccounts } from '../hooks/useAccounts'
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

const transactionTypeLabels: Record<'all' | TransactionType, string> = {
  all: 'All',
  expense: 'Expenses',
  income: 'Income',
  transfer: 'Transfers',
}

function normalizeSearchValue(value: string) {
  return value.trim().toLocaleLowerCase()
}

export function TransactionsPage() {
  const transactions = useLiveQuery(getTransactions, [])
  const accounts = useAccounts()
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [subcategoryFilter, setSubcategoryFilter] = useState('all')
  const [accountFilter, setAccountFilter] = useState('all')
  const [paymentModeFilter, setPaymentModeFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const allTransactions = transactions ?? []
  const accountNames = useMemo(() => new Map(accounts.flatMap((account) => account.id !== undefined ? [[account.id, account.name] as const] : [])), [accounts])
  const normalizedQuery = normalizeSearchValue(searchQuery)
  const categoryOptions = useMemo(() => Array.from(new Set(allTransactions.map((transaction) => transaction.category).filter(Boolean))).sort((a, b) => a.localeCompare(b)), [allTransactions])
  const subcategoryOptions = useMemo(() => Array.from(new Set(allTransactions.filter((transaction) => categoryFilter === 'all' || transaction.category === categoryFilter).map((transaction) => transaction.subcategory ?? '').filter(Boolean))).sort((a, b) => a.localeCompare(b)), [allTransactions, categoryFilter])
  const paymentModes = useMemo(() => Array.from(new Set(allTransactions.map((transaction) => transaction.paymentMode))).sort(), [allTransactions])
  const hasAdvancedFilter = categoryFilter !== 'all' || subcategoryFilter !== 'all' || accountFilter !== 'all' || paymentModeFilter !== 'all' || Boolean(dateFrom) || Boolean(dateTo) || Boolean(minAmount) || Boolean(maxAmount)
  const activeFilterCount = [categoryFilter !== 'all', subcategoryFilter !== 'all', accountFilter !== 'all', paymentModeFilter !== 'all', Boolean(dateFrom), Boolean(dateTo), Boolean(minAmount), Boolean(maxAmount)].filter(Boolean).length

  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((transaction) => {
      if (typeFilter !== 'all' && transaction.type !== typeFilter) return false
      if (categoryFilter !== 'all' && transaction.category !== categoryFilter) return false
      if (subcategoryFilter !== 'all' && transaction.subcategory !== subcategoryFilter) return false
      if (accountFilter !== 'all' && String(transaction.accountId) !== accountFilter) return false
      if (paymentModeFilter !== 'all' && transaction.paymentMode !== paymentModeFilter) return false
      if (dateFrom && transaction.date < dateFrom) return false
      if (dateTo && transaction.date > dateTo) return false
      if (minAmount && transaction.amount < Number(minAmount)) return false
      if (maxAmount && transaction.amount > Number(maxAmount)) return false
      if (!normalizedQuery) return true

      const searchableText = [
        transaction.category,
        transaction.subcategory ?? '',
        transaction.paymentMode.replace('-', ' '),
        transaction.note,
        transaction.hashtags.join(' '),
        transaction.type,
        accountNames.get(transaction.accountId) ?? '',
        transaction.date,
      ].join(' ').toLocaleLowerCase()

      return searchableText.includes(normalizedQuery)
    })
  }, [accountFilter, accountNames, allTransactions, categoryFilter, dateFrom, dateTo, maxAmount, minAmount, normalizedQuery, paymentModeFilter, subcategoryFilter, typeFilter])

  const groupedTransactions = filteredTransactions.reduce<Record<string, Transaction[]>>((groups, transaction) => {
    ;(groups[transaction.date] ||= []).push(transaction)
    return groups
  }, {})

  const hasActiveFilter = Boolean(normalizedQuery) || typeFilter !== 'all' || hasAdvancedFilter

  function clearFilters() {
    setSearchQuery('')
    setTypeFilter('all')
    setCategoryFilter('all')
    setSubcategoryFilter('all')
    setAccountFilter('all')
    setPaymentModeFilter('all')
    setDateFrom('')
    setDateTo('')
    setMinAmount('')
    setMaxAmount('')
  }

  function clearAdvancedFilters() {
    setCategoryFilter('all')
    setSubcategoryFilter('all')
    setAccountFilter('all')
    setPaymentModeFilter('all')
    setDateFrom('')
    setDateTo('')
    setMinAmount('')
    setMaxAmount('')
  }

  return <section className="transactions-page">
    <div className="page-heading"><div><p className="eyebrow">HISTORY</p><h2>All transactions</h2><p>Every transaction in one place.</p></div></div>

    <div className="transactions-filter" role="search" aria-label="Search and filter transactions">
      <label className="transactions-search">
        <Search size={18} aria-hidden="true" />
        <span className="sr-only">Search transactions</span>
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search transactions"
          autoComplete="off"
        />
        {searchQuery && <button type="button" className="transactions-search-clear" onClick={() => setSearchQuery('')} aria-label="Clear search"><X size={16} /></button>}
      </label>

      <div className="transaction-filter-toolbar">
        <div className="transaction-filter-chips" aria-label="Transaction type">
          {(Object.keys(transactionTypeLabels) as Array<'all' | TransactionType>).map((type) => <button
            key={type}
            type="button"
            className={`transaction-filter-chip ${typeFilter === type ? 'active' : ''}`}
            aria-pressed={typeFilter === type}
            onClick={() => setTypeFilter(type)}
          >{transactionTypeLabels[type]}</button>)}
        </div>
        <button type="button" className={`transactions-advanced-toggle ${hasAdvancedFilter ? 'active' : ''}`} onClick={() => setShowAdvancedFilters((open) => !open)} aria-expanded={showAdvancedFilters} aria-controls="transactions-advanced-filters">
          <SlidersHorizontal size={16} aria-hidden="true" />
          <span>Filters</span>
          {activeFilterCount > 0 && <strong>{activeFilterCount}</strong>}
        </button>
      </div>

      {showAdvancedFilters && <div id="transactions-advanced-filters" className="transactions-advanced-filters">
        <div className="advanced-filter-heading">
          <div><strong>Advanced filters</strong><span>Refine transactions by details, date, or amount.</span></div>
          {hasAdvancedFilter && <button type="button" className="text-button" onClick={clearAdvancedFilters}>Reset</button>}
        </div>
        <div className="advanced-filter-grid">
          <label><span>Category</span><select value={categoryFilter} onChange={(event) => { setCategoryFilter(event.target.value); setSubcategoryFilter('all') }}><option value="all">All categories</option>{categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
          <label><span>Subcategory</span><select value={subcategoryFilter} onChange={(event) => setSubcategoryFilter(event.target.value)}><option value="all">All subcategories</option>{subcategoryOptions.map((subcategory) => <option key={subcategory} value={subcategory}>{subcategory}</option>)}</select></label>
          <label><span>Account</span><select value={accountFilter} onChange={(event) => setAccountFilter(event.target.value)}><option value="all">All accounts</option>{accounts.filter((account) => account.id !== undefined).map((account) => <option key={account.id} value={String(account.id)}>{account.name}</option>)}</select></label>
          <label><span>Payment mode</span><select value={paymentModeFilter} onChange={(event) => setPaymentModeFilter(event.target.value)}><option value="all">All payment modes</option>{paymentModes.map((mode) => <option key={mode} value={mode}>{mode.replace('-', ' ')}</option>)}</select></label>
          <label><span>From date</span><input type="date" value={dateFrom} max={dateTo || undefined} onChange={(event) => setDateFrom(event.target.value)} /></label>
          <label><span>To date</span><input type="date" value={dateTo} min={dateFrom || undefined} onChange={(event) => setDateTo(event.target.value)} /></label>
          <label><span>Minimum amount</span><input type="number" inputMode="decimal" min="0" step="0.01" value={minAmount} onChange={(event) => setMinAmount(event.target.value)} placeholder="₹ 0" /></label>
          <label><span>Maximum amount</span><input type="number" inputMode="decimal" min="0" step="0.01" value={maxAmount} onChange={(event) => setMaxAmount(event.target.value)} placeholder="₹ 0" /></label>
        </div>
      </div>}
    </div>

    {filteredTransactions.length ? <div className="transaction-day-list">{Object.entries(groupedTransactions).map(([date, dayTransactions]) => <section className="transaction-day-card" key={date}><h3>{dateLabel(date)}</h3><div className="transaction-day-rows">{dayTransactions.map((transaction) => { const CategoryIcon = getCategoryIcon(getCategoryIconKey(transaction.type, transaction.category)); return <Link className="all-transaction-row" to={`/transactions/${transaction.id}`} key={transaction.id}><span className={`transaction-icon category-icon ${transaction.type === 'income' ? 'income' : ''}`}><CategoryIcon size={19} /></span><span className="recent-copy"><strong>{transaction.subcategory || transaction.category}</strong><span>{transaction.paymentMode.replace('-', ' ')}</span></span><span className="recent-amount"><strong className={transaction.type === 'income' ? 'income-amount' : transaction.type === 'expense' ? 'expense-amount' : 'transfer-amount'}>{formatCurrency(transaction.amount)}</strong><span>{formatTime(transaction.time)}</span></span></Link> })}</div></section>)}</div> : allTransactions.length ? <div className="transactions-no-results"><strong>No matching transactions</strong><span>{normalizedQuery ? `No transactions match “${searchQuery}”.` : 'No transactions match the selected type.'}</span>{hasActiveFilter && <button type="button" className="transactions-clear-filters" onClick={clearFilters}>Clear filters</button>}</div> : <div className="dashboard-empty">No transactions yet.</div>}
  </section>
}
