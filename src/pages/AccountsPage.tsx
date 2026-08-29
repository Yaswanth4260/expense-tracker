import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Banknote,
  Building2,
  CreditCard,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Wallet,
  X,
} from 'lucide-react'

import type { Account, AccountType } from '../types/account'
import {
  createAccount,
  deleteAccount,
  updateAccount,
} from '../db/repositories/accountRepository'
import { getTransactions } from '../db/repositories/transactionRepository'
import { useAccounts } from '../hooks/useAccounts'
import { getAccountBalance } from '../utils/accountCalculations'
import { formatCurrency } from '../utils/formatCurrency'

const accountTypes: {
  value: AccountType
  label: string
}[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank' },
  { value: 'credit-card', label: 'Credit Card' },
  { value: 'wallet', label: 'Wallet' },
  { value: 'other', label: 'Other' },
]

function getAccountIcon(type: AccountType) {
  switch (type) {
    case 'cash':
      return Banknote

    case 'bank':
      return Building2

    case 'credit-card':
      return CreditCard

    case 'wallet':
      return Wallet

    default:
      return MoreHorizontal
  }
}

type FormState = {
  name: string
  type: AccountType
  openingBalance: string
}

const initialForm: FormState = {
  name: '',
  type: 'bank',
  openingBalance: '0',
}

export function AccountsPage() {
  const accounts = useAccounts()

  const transactions = useLiveQuery(getTransactions, []) ?? []

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)

  const [form, setForm] = useState<FormState>(initialForm)

  const [error, setError] = useState('')

  const totalBalance = accounts.reduce(
    (total, account) =>
      total + getAccountBalance(account, transactions),
    0,
  )

  function openCreateForm() {
    setEditingAccount(null)
    setForm(initialForm)
    setError('')
    setIsFormOpen(true)
  }

  function openEditForm(account: Account) {
    setEditingAccount(account)

    setForm({
      name: account.name,
      type: account.type,
      openingBalance: String(account.openingBalance),
    })

    setError('')
    setIsFormOpen(true)
  }

  function closeForm() {
    setIsFormOpen(false)
    setEditingAccount(null)
    setForm(initialForm)
    setError('')
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const name = form.name.trim()
    const openingBalance = Number(form.openingBalance)

    if (!name) {
      setError('Please enter an account name.')
      return
    }

    if (!Number.isFinite(openingBalance)) {
      setError('Please enter a valid opening balance.')
      return
    }

    const now = new Date().toISOString()

    try {
      if (editingAccount?.id) {
        await updateAccount(editingAccount.id, {
          name,
          type: form.type,
          openingBalance,
          updatedAt: now,
        })
      } else {
        await createAccount({
          name,
          type: form.type,
          openingBalance,
          icon: form.type,
          createdAt: now,
          updatedAt: now,
        })
      }

      closeForm()
    } catch {
      setError('Unable to save the account. Please try again.')
    }
  }

  async function handleDelete(account: Account) {
    if (!account.id) return

    const confirmed = window.confirm(
      `Delete "${account.name}"?`,
    )

    if (!confirmed) return

    try {
      await deleteAccount(account.id)
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to delete this account.'

      window.alert(message)
    }
  }

  return (
    <section className="accounts-page">
      <div className="accounts-page-header">
        <div>
          <p className="ui-eyebrow">YOUR MONEY</p>
          <h2>Accounts</h2>
        </div>

        <button
          type="button"
          className="accounts-add-button"
          onClick={openCreateForm}
        >
          <Plus size={20} />
          Add Account
        </button>
      </div>

      <div className="accounts-total-card">
        <span>Total Balance</span>

        <strong>
          {formatCurrency(totalBalance)}
        </strong>

        <p>
          Across {accounts.length}{' '}
          {accounts.length === 1 ? 'account' : 'accounts'}
        </p>
      </div>

      <div className="accounts-list">
        {accounts.map((account) => {
          const Icon = getAccountIcon(account.type)

          const balance = getAccountBalance(
            account,
            transactions,
          )

          return (
            <article
              className="account-card"
              key={account.id}
            >
              <div className="account-main">
                <div className="account-icon">
                  <Icon size={24} />
                </div>

                <div className="account-information">
                  <strong>{account.name}</strong>

                  <span>
                    {accountTypes.find(
                      (item) => item.value === account.type,
                    )?.label}
                  </span>
                </div>
              </div>

              <div className="account-actions">
                <strong>
                  {formatCurrency(balance)}
                </strong>

                <div className="account-action-buttons">
                  <button
                    type="button"
                    aria-label={`Edit ${account.name}`}
                    onClick={() => openEditForm(account)}
                  >
                    <Pencil size={17} />
                  </button>

                  <button
                    type="button"
                    aria-label={`Delete ${account.name}`}
                    onClick={() => handleDelete(account)}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {!accounts.length && (
        <div className="accounts-empty-state">
          <Wallet size={32} />

          <h3>No accounts yet</h3>

          <p>
            Create an account to organize your money.
          </p>

          <button
            type="button"
            onClick={openCreateForm}
          >
            <Plus size={18} />
            Add Account
          </button>
        </div>
      )}

      {isFormOpen && (
        <div
          className="account-modal-backdrop"
          onClick={closeForm}
        >
          <div
            className="account-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="account-modal-header">
              <h3>
                {editingAccount
                  ? 'Edit Account'
                  : 'Add Account'}
              </h3>

              <button
                type="button"
                aria-label="Close"
                onClick={closeForm}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label>
                Account Name

                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      name: event.target.value,
                    })
                  }
                  placeholder="For example, HDFC Bank"
                />
              </label>

              <label>
                Account Type

                <select
                  value={form.type}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      type: event.target.value as AccountType,
                    })
                  }
                >
                  {accountTypes.map((type) => (
                    <option
                      key={type.value}
                      value={type.value}
                    >
                      {type.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Opening Balance

                <input
                  type="number"
                  inputMode="decimal"
                  value={form.openingBalance}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      openingBalance: event.target.value,
                    })
                  }
                  placeholder="0"
                />
              </label>

              {error && (
                <p className="account-form-error">
                  {error}
                </p>
              )}

              <div className="account-form-actions">
                <button
                  type="button"
                  className="account-cancel-button"
                  onClick={closeForm}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="account-save-button"
                >
                  {editingAccount
                    ? 'Save Changes'
                    : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}