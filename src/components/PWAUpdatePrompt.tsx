import { useRegisterSW } from 'virtual:pwa-register/react'

export default function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      console.log(
        'PWA service worker registered:',
        swUrl,
      )

      if (registration) {
        console.log(
          'PWA service worker registration:',
          registration,
        )
      }
    },

    onRegisterError(error) {
      console.error(
        'PWA service worker registration error:',
        error,
      )
    },
  })

  const closePrompt = () => {
    setNeedRefresh(false)
    setOfflineReady(false)
  }

  if (!needRefresh && !offlineReady) {
    return null
  }

  return (
    <div
      className="pwa-update-prompt"
      role="status"
      aria-live="polite"
    >
      <div className="pwa-update-content">
        <div>
          <strong>
            {needRefresh
              ? 'Update available'
              : 'Ready to use offline'}
          </strong>

          <span>
            {needRefresh
              ? 'A new version of Expense Tracker is ready.'
              : 'Expense Tracker is ready to work offline.'}
          </span>
        </div>

        {needRefresh ? (
          <div className="pwa-update-actions">
            <button
              type="button"
              className="pwa-update-later"
              onClick={closePrompt}
            >
              Later
            </button>

            <button
              type="button"
              className="pwa-update-button"
              onClick={() => updateServiceWorker(true)}
            >
              Update
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="pwa-update-button"
            onClick={closePrompt}
          >
            Got it
          </button>
        )}
      </div>
    </div>
  )
}