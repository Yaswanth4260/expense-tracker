import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  PieChart,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react'

import {
  Card,
  PageHeader,
  SegmentedControl,
  SectionHeader,
} from '../components/ui'

import { getTransactions } from '../db/repositories/transactionRepository'

import {
  getCategoryTotals,
  getMonthlyTotals,
  getPeriodTransactions,
  type AnalysisPeriod,
} from '../utils/analysisCalculations'

import { formatCurrency } from '../utils/formatCurrency'

const categoryClassNames = [
  'category-one',
  'category-two',
  'category-three',
  'category-four',
  'category-five',
]

function getCategoryClass(index: number) {
  return (
    categoryClassNames[
      index % categoryClassNames.length
    ]
  )
}

function DonutChart({
  categories,
}: {
  categories: ReturnType<typeof getCategoryTotals>
}) {
  if (!categories.length) {
    return (
      <div className="analysis-chart-empty">
        No expense data yet.
      </div>
    )
  }

  const radius = 62
  const circumference =
    2 * Math.PI * radius

  let offset = 0

  return (
    <div className="donut-chart-wrapper">
      <svg
        className="donut-chart"
        viewBox="0 0 160 160"
        aria-label="Expense category breakdown"
      >
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="24"
        />

        {categories
          .slice(0, 5)
          .map((category, index) => {
            const length =
              (category.percentage / 100) *
              circumference

            const dashArray = `${length} ${
              circumference - length
            }`

            const dashOffset = -offset

            offset += length

            return (
              <circle
                key={category.category}
                className={`donut-segment ${getCategoryClass(index)}`}
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                strokeWidth="24"
                strokeDasharray={dashArray}
                strokeDashoffset={
                  dashOffset
                }
                transform="rotate(-90 80 80)"
              />
            )
          })}
      </svg>

      <div className="donut-center">
        <PieChart size={17} />
        <span>Expenses</span>
      </div>
    </div>
  )
}

function MonthlyBarChart({
  months,
}: {
  months: ReturnType<typeof getMonthlyTotals>
}) {
  const maximum = Math.max(
    ...months.flatMap((month) => [
      month.income,
      month.expense,
    ]),
    1,
  )

  return (
    <div className="monthly-chart">
      <div className="monthly-chart-grid">
        {months.map((month) => {
          const incomeHeight =
            (month.income / maximum) * 100

          const expenseHeight =
            (month.expense / maximum) * 100

          return (
            <div
              className="monthly-chart-column"
              key={month.month}
            >
              <div className="monthly-bars">
                <div
                  className="monthly-bar income"
                  style={{
                    height: `${Math.max(
                      incomeHeight,
                      month.income > 0
                        ? 3
                        : 0,
                    )}%`,
                  }}
                  title={`Income: ${formatCurrency(
                    month.income,
                  )}`}
                />

                <div
                  className="monthly-bar expense"
                  style={{
                    height: `${Math.max(
                      expenseHeight,
                      month.expense > 0
                        ? 3
                        : 0,
                    )}%`,
                  }}
                  title={`Expense: ${formatCurrency(
                    month.expense,
                  )}`}
                />
              </div>

              <span>{month.label}</span>
            </div>
          )
        })}
      </div>

      <div className="chart-legend">
        <span>
          <i className="legend-dot income" />
          Income
        </span>

        <span>
          <i className="legend-dot expense" />
          Expenses
        </span>
      </div>
    </div>
  )
}

function CategorySpendChart({
  category,
  transactions,
}: {
  category: string
  transactions: ReturnType<typeof getPeriodTransactions>
}) {
  const totals = transactions
    .filter((transaction) => transaction.type === 'expense' && transaction.category === category)
    .reduce((result, transaction) => {
      const label = transaction.subcategory || 'Other'
      result.set(label, (result.get(label) || 0) + transaction.amount)
      return result
    }, new Map<string, number>())
  const entries = [...totals.entries()].sort((first, second) => second[1] - first[1])
  const maximum = Math.max(...entries.map((entry) => entry[1]), 1)
  const total = entries.reduce((sum, entry) => sum + entry[1], 0)

  return <div className="category-spend-detail">
    <div className="category-spend-heading"><div><span className="analysis-section-period">SELECTED CATEGORY</span><h4>{category}</h4></div><strong>{formatCurrency(total)}</strong></div>
    {entries.length ? <div className="category-spend-chart">{entries.map(([label, amount]) => <div className="category-spend-bar-row" key={label}><div className="category-spend-bar-label"><span>{label}</span><strong>{formatCurrency(amount)}</strong></div><div className="category-spend-bar-track"><div className="category-spend-bar-fill" style={{ width: `${(amount / maximum) * 100}%` }} /></div></div>)}</div> : <div className="analysis-list-empty">No spending recorded for this category.</div>}
  </div>
}

export function AnalysisPage() {
  const transactions =
    useLiveQuery(
      getTransactions,
      [],
      [],
    )

  const [period, setPeriod] =
    useState<AnalysisPeriod>('month')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const periodTransactions =
    useMemo(
      () =>
        getPeriodTransactions(
          transactions,
          period,
        ),
      [transactions, period],
    )

  const income = periodTransactions
    .filter(
      (transaction) =>
        transaction.type === 'income',
    )
    .reduce(
      (total, transaction) =>
        total + transaction.amount,
      0,
    )

  const expenses = periodTransactions
    .filter(
      (transaction) =>
        transaction.type === 'expense',
    )
    .reduce(
      (total, transaction) =>
        total + transaction.amount,
      0,
    )

  const net = income - expenses

  const categoryTotals =
    useMemo(
      () =>
        getCategoryTotals(
          periodTransactions,
        ),
      [periodTransactions],
    )

  const activeCategory = selectedCategory && categoryTotals.some((category) => category.category === selectedCategory)
    ? selectedCategory
    : null

  const monthlyTotals =
    useMemo(
      () =>
        getMonthlyTotals(
          transactions,
          6,
        ),
      [transactions],
    )

  const savingsRate =
    income > 0
      ? ((income - expenses) / income) *
        100
      : 0

  const periodLabel =
    period === 'month'
      ? 'This Month'
      : period === 'last-month'
        ? 'Last Month'
        : period === 'year'
          ? 'This Year'
          : 'All Time'

  return (
    <section className="analysis-page">
      <PageHeader
        eyebrow="INSIGHTS"
        title="Analysis"
        description="Understand where your money is going."
        action={
          <div className="analysis-header-icon">
            <BarChart3 size={20} />
          </div>
        }
      />

      <Card className="analysis-period-card">
        <SegmentedControl
          value={period}
          onChange={setPeriod}
          label="Analysis period"
          options={[
            {
              value: 'month',
              label: 'Month',
            },
            {
              value: 'last-month',
              label: 'Last month',
            },
            {
              value: 'year',
              label: 'Year',
            },
            {
              value: 'all',
              label: 'All time',
            },
          ]}
        />
      </Card>

      <section className="analysis-summary-grid">
        <Card className="analysis-summary-card">
          <span className="analysis-summary-label">
            INCOME
          </span>

          <div className="analysis-summary-icon income">
            <ArrowDownLeft size={17} />
          </div>

          <strong>
            {formatCurrency(income)}
          </strong>
        </Card>

        <Card className="analysis-summary-card">
          <span className="analysis-summary-label">
            EXPENSES
          </span>

          <div className="analysis-summary-icon expense">
            <ArrowUpRight size={17} />
          </div>

          <strong>
            {formatCurrency(expenses)}
          </strong>
        </Card>

        <Card className="analysis-summary-card">
          <span className="analysis-summary-label">
            NET
          </span>

          <div className="analysis-summary-icon net">
            {net >= 0 ? (
              <TrendingUp size={17} />
            ) : (
              <TrendingDown size={17} />
            )}
          </div>

          <strong
            className={
              net < 0
                ? 'analysis-negative'
                : ''
            }
          >
            {formatCurrency(net)}
          </strong>
        </Card>
      </section>

      <section className="analysis-section">
        <SectionHeader
          title="Income vs expenses"
          action={
            <span className="analysis-section-period">
              {periodLabel}
            </span>
          }
        />

        <Card className="analysis-chart-card">
          <MonthlyBarChart
            months={monthlyTotals}
          />
        </Card>
      </section>

      <section className="analysis-section">
        <SectionHeader title="Expense categories" />

        <Card className="analysis-category-card">
          <div className="analysis-donut-area">
            <DonutChart categories={categoryTotals} />
            <div className="category-list">
              {categoryTotals.slice(0, 5).map((category, index) => <button className={`category-row ${activeCategory === category.category ? 'selected' : ''}`} type="button" key={category.category} onClick={() => setSelectedCategory(activeCategory === category.category ? null : category.category)}><span className="category-name"><i className={`category-dot ${getCategoryClass(index)}`} />{category.category}</span><span className="category-values"><strong>{formatCurrency(category.amount)}</strong><small>{category.percentage.toFixed(1)}%</small></span></button>)}
              {!categoryTotals.length && <div className="analysis-list-empty">Add expense transactions to see your category breakdown.</div>}
            </div>
          </div>
        </Card>
        {activeCategory && <div className="category-spend-overlay" role="presentation" onClick={() => setSelectedCategory(null)}>
          <div className="category-spend-modal" role="dialog" aria-modal="true" aria-label={`${activeCategory} spending details`} onClick={(event) => event.stopPropagation()}>
            <button className="category-spend-close" type="button" onClick={() => setSelectedCategory(null)} aria-label="Close category details" title="Close category details"><X size={18} /></button>
            <CategorySpendChart category={activeCategory} transactions={periodTransactions} />
          </div>
        </div>}
      </section>

      <section className="analysis-section">
        <SectionHeader title="Quick insight" />

        <Card className="analysis-insight-card">
          <div className="analysis-insight-icon">
            {savingsRate >= 0 ? (
              <TrendingUp size={18} />
            ) : (
              <TrendingDown size={18} />
            )}
          </div>

          <div>
            <strong>
              {income === 0
                ? 'No income recorded yet'
                : savingsRate >= 0
                  ? `${savingsRate.toFixed(
                      1,
                    )}% of your income remains`
                  : 'Your expenses are higher than your income'}
            </strong>

            <p>
              Based on {periodLabel.toLowerCase()}{' '}
              transactions.
            </p>
          </div>
        </Card>
      </section>
    </section>
  )
}