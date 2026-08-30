import { useEffect, useState } from 'react'

interface PWAUpdatePromptProps {
  updateSW: (reloadPage?: boolean) => Promise<void>
}

export default function PWAUpdatePrompt({
  updateSW,
}: PWAUpdatePromptProps) {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    const handleUpdateAvailable = () => {
      setUpdateAvailable(true)
    }

    window.addEventListener(
      'pwa-update-available',
      handleUpdateAvailable,
    )

    return () => {
      window.removeEventListener(
        'pwa-update-available',
        handleUpdateAvailable,
      )
    }
  }, [])

  const handleUpdate = async () => {
    setUpdating(true)

    try {
      await updateSW(true)
    } catch {
      window.location.reload()
    }
  }

  if (!updateAvailable) {
    return null
  }

  return (
    <div className="pwa-update-prompt" role="status">
      <div className="pwa-update-content">
        <div>
          <strong>Update available</strong>
          <span>
            A new version of Expense Tracker is ready.
          </span>
        </div>

        <button
          type="button"
          onClick={handleUpdate}
          disabled={updating}
        >
          {updating ? 'Updating…' : 'Update'}
        </button>
      </div>
    </div>
  )
}