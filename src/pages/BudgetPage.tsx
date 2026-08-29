import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  CalendarDays,
  Pencil,
  Plus,
  Trash2,
  Wallet,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import {
  Card,
  EmptyState,
  PageHeader,
  PrimaryButton,
  SegmentedControl,
} from '../components/ui'

import {
  createBudget,
  deleteBudget,
  getBudgets,
  updateBudget,
} from '../db/repositories/budgetRepository'

import { getTransactions } from '../db/repositories/transactionRepository'

import type { BudgetType } from '../types/budget'

import { formatCurrency } from '../utils/formatCurrency'
import { getTotalExpense } from '../utils/dashboardCalculations'

function getCurrentMonth() {
  const now = new Date()

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1,
  ).padStart(2, '0')}`
}

function getCurrentYear() {
  return String(new Date().getFullYear())
}

function getMonthLabel() {
  return new Intl.DateTimeFormat('en-IN', {
    month: 'long',
    year: 'numeric',
  }).format(new Date())
}

export function BudgetPage() {
  const navigate = useNavigate()

  const budgets = useLiveQuery(
    getBudgets,
    [],
    [],
  )

  const transactions = useLiveQuery(
    getTransactions,
    [],
    [],
  )

  const [budgetType, setBudgetType] =
    useState<BudgetType>('monthly')

  const [showForm, setShowForm] =
    useState(false)

  const [amountInput, setAmountInput] =
    useState('')

  const currentMonth = getCurrentMonth()
  const currentYear = getCurrentYear()

  const currentPeriod =
    budgetType === 'monthly'
      ? currentMonth
      : currentYear

  const currentBudget = budgets.find(
    (budget) =>
      budget.type === budgetType &&
      budget.period === currentPeriod,
  )

  const periodTransactions = useMemo(() => {
    if (budgetType === 'monthly') {
      return transactions.filter(
        (transaction) =>
          transaction.type === 'expense' &&
          transaction.date.startsWith(
            currentMonth,
          ),
      )
    }

    return transactions.filter(
      (transaction) =>
        transaction.type === 'expense' &&
        transaction.date.startsWith(
          currentYear,
        ),
    )
  }, [
    transactions,
    budgetType,
    currentMonth,
    currentYear,
  ])

  const spent = getTotalExpense(
    periodTransactions,
  )

  const budgetAmount =
    currentBudget?.amount ?? 0

  const remaining =
    budgetAmount - spent

  const percentage =
    budgetAmount > 0
      ? (spent / budgetAmount) * 100
      : 0

  const progressWidth = Math.min(
    percentage,
    100,
  )

  const isWarning =
    percentage >= 80 &&
    percentage < 100

  const isExceeded =
    percentage >= 100

  const periodLabel =
    budgetType === 'monthly'
      ? getMonthLabel()
      : currentYear

  function openCreateForm() {
    setAmountInput('')
    setShowForm(true)
  }

  function openEditForm() {
    if (!currentBudget) return

    setAmountInput(
      String(currentBudget.amount),
    )

    setShowForm(true)
  }

  function closeForm() {
    setAmountInput('')
    setShowForm(false)
  }

  async function handleSave() {
    const amount = Number(amountInput)

    if (!Number.isFinite(amount) || amount <= 0) {
      window.alert(
        'Please enter a valid budget amount.',
      )

      return
    }

    const now =
      new Date().toISOString()

    if (currentBudget?.id !== undefined) {
      await updateBudget(
        currentBudget.id,
        {
          amount,
          updatedAt: now,
        },
      )
    } else {
      await createBudget({
        type: budgetType,
        period: currentPeriod,
        amount,
        createdAt: now,
        updatedAt: now,
      })
    }

    closeForm()
  }

  async function handleDelete() {
    if (currentBudget?.id === undefined) {
      return
    }

    const confirmed =
      window.confirm(
        `Delete the ${budgetType} budget for ${periodLabel}?`,
      )

    if (!confirmed) return

    await deleteBudget(
      currentBudget.id,
    )

    closeForm()
  }

  return (
    <section className="budget-page">
      <PageHeader
        eyebrow="PLANNING"
        title="Budget"
        description="Set spending limits and keep your expenses on track."
        action={
          <div className="budget-header-icon">
            <Wallet size={20} />
          </div>
        }
      />

      <Card className="budget-period-card">
        <SegmentedControl
          label="Budget period"
          value={budgetType}
          onChange={setBudgetType}
          options={[
            {
              value: 'monthly',
              label: 'Monthly',
            },
            {
              value: 'annual',
              label: 'Annual',
            },
          ]}
        />
      </Card>

      <Card className="budget-overview-card">
        <div className="budget-overview-heading">
          <div>
            <p className="ui-eyebrow">
              {budgetType === 'monthly'
                ? 'THIS MONTH'
                : 'THIS YEAR'}
            </p>

            <h3>{periodLabel}</h3>
          </div>

          <div className="budget-calendar-icon">
            <CalendarDays size={20} />
          </div>
        </div>

        {!currentBudget ? (
          <EmptyState
            title={`No ${budgetType} budget`}
            description={`Set a budget for ${periodLabel} to track your spending.`}
            action={
              <PrimaryButton
                onClick={openCreateForm}
              >
                <Plus size={16} />
                Set budget
              </PrimaryButton>
            }
          />
        ) : (
          <>
            <div className="budget-amount-row">
              <span>Budget</span>

              <strong>
                {formatCurrency(
                  budgetAmount,
                )}
              </strong>
            </div>

            <div className="budget-stat-grid">
              <div>
                <span>Spent</span>

                <strong>
                  {formatCurrency(spent)}
                </strong>
              </div>

              <div>
                <span>
                  {remaining >= 0
                    ? 'Remaining'
                    : 'Over budget'}
                </span>

                <strong
                  className={
                    remaining < 0
                      ? 'budget-negative'
                      : ''
                  }
                >
                  {formatCurrency(
                    Math.abs(remaining),
                  )}
                </strong>
              </div>
            </div>

            <div className="budget-progress">
              <div className="budget-progress-track">
                <div
                  className={[
                    'budget-progress-fill',
                    isWarning
                      ? 'warning'
                      : '',
                    isExceeded
                      ? 'exceeded'
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  style={{
                    width: `${progressWidth}%`,
                  }}
                />
              </div>

              <div className="budget-progress-labels">
                <span>
                  {percentage.toFixed(1)}% used
                </span>

                <span>
                  {formatCurrency(spent)} spent
                </span>
              </div>
            </div>

            <div
              className={[
                'budget-status',
                isWarning
                  ? 'warning'
                  : '',
                isExceeded
                  ? 'exceeded'
                  : 'healthy',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {isExceeded
                ? `You are ${formatCurrency(
                    Math.abs(remaining),
                  )} over budget.`
                : isWarning
                  ? 'You are approaching your budget limit.'
                  : 'Your spending is on track.'}
            </div>

            <div className="budget-actions">
              <button
                type="button"
                onClick={openEditForm}
              >
                <Pencil size={15} />
                Edit budget
              </button>

              <button
                type="button"
                onClick={handleDelete}
              >
                <Trash2 size={15} />
                Delete
              </button>
            </div>
          </>
        )}
      </Card>

      {showForm && (
        <div
          className="budget-modal-backdrop"
          onClick={closeForm}
        >
          <div
            className="budget-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="budget-modal-header">
              <div>
                <p className="ui-eyebrow">
                  {currentBudget
                    ? 'UPDATE'
                    : 'NEW BUDGET'}
                </p>

                <h3>
                  {currentBudget
                    ? 'Edit budget'
                    : 'Set budget'}
                </h3>
              </div>

              <button
                type="button"
                onClick={closeForm}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <label className="budget-input-label">
              {budgetType === 'monthly'
                ? 'Monthly'
                : 'Annual'}{' '}
              budget

              <div className="budget-input">
                <span>₹</span>

                <input
                  type="number"
                  inputMode="decimal"
                  min="1"
                  value={amountInput}
                  onChange={(event) =>
                    setAmountInput(
                      event.target.value,
                    )
                  }
                  placeholder="Enter amount"
                  autoFocus
                />
              </div>
            </label>

            <div className="budget-modal-actions">
              <button
                type="button"
                className="budget-cancel-button"
                onClick={closeForm}
              >
                Cancel
              </button>

              <button
                type="button"
                className="budget-save-button"
                onClick={handleSave}
              >
                Save budget
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        className="budget-back-link"
        onClick={() => navigate('/')}
      >
        Back to dashboard
      </button>
    </section>
  )
}