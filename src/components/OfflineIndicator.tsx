import { WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'

export function OfflineIndicator() {
  const [isOffline, setIsOffline] =
    useState(!navigator.onLine)

  useEffect(() => {
    const handleOnline = () =>
      setIsOffline(false)

    const handleOffline = () =>
      setIsOffline(true)

    window.addEventListener(
      'online',
      handleOnline,
    )

    window.addEventListener(
      'offline',
      handleOffline,
    )

    return () => {
      window.removeEventListener(
        'online',
        handleOnline,
      )

      window.removeEventListener(
        'offline',
        handleOffline,
      )
    }
  }, [])

  if (!isOffline) {
    return null
  }

  return (
    <div
      className="offline-indicator"
      role="status"
    >
      <WifiOff size={15} />

      <span>
        You're offline
      </span>
    </div>
  )
}