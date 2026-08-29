import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  Check,
  Download,
  Moon,
  RotateCcw,
  ShieldCheck,
  Sun,
  Trash2,
  Upload,
} from 'lucide-react'

import {
  Card,
  PageHeader,
  SectionHeader,
} from '../components/ui'

import {
  exportBackup,
  readBackupFile,
  restoreBackup,
  resetAllData,
} from '../services/dataBackupService'

type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY =
  'expense-tracker-theme'

function getStoredTheme(): Theme {
  const stored =
    localStorage.getItem(
      THEME_STORAGE_KEY,
    )

  return stored === 'dark'
    ? 'dark'
    : 'light'
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme =
    theme
}

export function SettingsPage() {
  const [theme, setTheme] =
    useState<Theme>(() =>
      getStoredTheme(),
    )

  const [busy, setBusy] =
    useState(false)

  const [message, setMessage] =
    useState('')

  const [error, setError] =
    useState('')

  const fileInputRef =
    useRef<HTMLInputElement>(null)

  useEffect(() => {
    applyTheme(theme)

    localStorage.setItem(
      THEME_STORAGE_KEY,
      theme,
    )
  }, [theme])

  function clearFeedback() {
    setMessage('')
    setError('')
  }

  async function handleExport() {
    clearFeedback()
    setBusy(true)

    try {
      await exportBackup()

      setMessage(
        'Backup exported successfully.',
      )
    } catch {
      setError(
        'Could not export your data.',
      )
    } finally {
      setBusy(false)
    }
  }

  function openImportPicker() {
    clearFeedback()
    fileInputRef.current?.click()
  }

  async function handleImport(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0]

    event.target.value = ''

    if (!file) return

    clearFeedback()

    const confirmed =
      window.confirm(
        'Importing a backup will replace your current transactions, accounts and budgets. Continue?',
      )

    if (!confirmed) return

    setBusy(true)

    try {
      const backup =
        await readBackupFile(file)

      await restoreBackup(backup)

      setMessage(
        'Backup imported successfully.',
      )
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : 'Could not import the backup.',
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleReset() {
    clearFeedback()

    const confirmed =
      window.confirm(
        'Delete ALL transactions, accounts and budgets? This cannot be undone.',
      )

    if (!confirmed) return

    const secondConfirmation =
      window.confirm(
        'Are you absolutely sure? Your current local data will be permanently removed.',
      )

    if (!secondConfirmation) return

    setBusy(true)

    try {
      await resetAllData()

      setMessage(
        'All data has been reset.',
      )
    } catch {
      setError(
        'Could not reset your data.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="settings-page">
      <PageHeader
        eyebrow="PREFERENCES"
        title="Settings"
        description="Manage your app preferences and local data."
        action={
          <div className="settings-header-icon">
            <ShieldCheck size={20} />
          </div>
        }
      />

      {message && (
        <div className="settings-feedback success">
          <Check size={16} />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="settings-feedback error">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      <section className="settings-section">
        <SectionHeader title="Appearance" />

        <Card className="settings-card">
          <div className="settings-row">
            <div className="settings-row-icon">
              {theme === 'dark' ? (
                <Moon size={18} />
              ) : (
                <Sun size={18} />
              )}
            </div>

            <div className="settings-row-copy">
              <strong>Dark mode</strong>
              <span>
                {theme === 'dark'
                  ? 'Dark appearance is enabled.'
                  : 'Use the light appearance.'}
              </span>
            </div>

            <button
              type="button"
              className={`settings-toggle ${
                theme === 'dark'
                  ? 'active'
                  : ''
              }`}
              aria-label="Toggle dark mode"
              aria-pressed={
                theme === 'dark'
              }
              onClick={() =>
                setTheme(
                  theme === 'dark'
                    ? 'light'
                    : 'dark',
                )
              }
            >
              <span />
            </button>
          </div>
        </Card>
      </section>

      <section className="settings-section">
        <SectionHeader title="Data management" />

        <Card className="settings-card">
          <button
            type="button"
            className="settings-action-row"
            onClick={handleExport}
            disabled={busy}
          >
            <span className="settings-row-icon">
              <Download size={18} />
            </span>

            <span className="settings-row-copy">
              <strong>
                Export backup
              </strong>

              <span>
                Save your transactions,
                accounts and budgets as
                JSON.
              </span>
            </span>
          </button>

          <div className="settings-divider" />

          <button
            type="button"
            className="settings-action-row"
            onClick={openImportPicker}
            disabled={busy}
          >
            <span className="settings-row-icon">
              <Upload size={18} />
            </span>

            <span className="settings-row-copy">
              <strong>
                Import backup
              </strong>

              <span>
                Restore data from a previous
                backup.
              </span>
            </span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="settings-hidden-file"
            onChange={handleImport}
          />

          <div className="settings-divider" />

          <button
            type="button"
            className="settings-action-row destructive"
            onClick={handleReset}
            disabled={busy}
          >
            <span className="settings-row-icon">
              <Trash2 size={18} />
            </span>

            <span className="settings-row-copy">
              <strong>
                Reset all data
              </strong>

              <span>
                Permanently remove all local
                transactions, accounts and
                budgets.
              </span>
            </span>

            <RotateCcw size={16} />
          </button>
        </Card>
      </section>

      <section className="settings-section">
        <SectionHeader title="Preferences" />

        <Card className="settings-card">
          <div className="settings-simple-row">
            <div>
              <strong>Currency</strong>
              <span>
                All amounts are displayed in
                Indian Rupees.
              </span>
            </div>

            <strong className="settings-value">
              ₹ INR
            </strong>
          </div>
        </Card>
      </section>

      <section className="settings-section">
        <SectionHeader title="About" />

        <Card className="settings-about-card">
          <div className="settings-about-icon">
            ₹
          </div>

          <strong>Expense Tracker</strong>

          <span>
            A simple mobile-first personal
            finance tracker.
          </span>

          <small>
            Version 1.0.0
          </small>
        </Card>
      </section>
    </section>
  )
}