'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  isOnline,
  getOfflineQueue,
  processOfflineQueue,
  requestBackgroundSync,
} from '@/lib/pwa'

export function useOnlineStatus() {
  const [online, setOnline] = useState(true)
  const [queueCount, setQueueCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    // Set initial state
    setOnline(isOnline())
    setQueueCount(getOfflineQueue().length)

    const handleSync = async () => {
      if (isSyncing) return
      setIsSyncing(true)
      try {
        const result = await processOfflineQueue()
        setQueueCount(getOfflineQueue().length)
        if (result.success > 0) {
          window.dispatchEvent(
            new CustomEvent('attendance-synced', { detail: result })
          )
        }
        await requestBackgroundSync()
      } finally {
        setIsSyncing(false)
      }
    }

    const handleOnline = () => {
      setOnline(true)
      // Auto-sync when coming back online
      handleSync()
    }
    const handleOffline = () => setOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const syncNow = useCallback(async () => {
    if (isSyncing) return
    setIsSyncing(true)
    try {
      const result = await processOfflineQueue()
      setQueueCount(getOfflineQueue().length)
      if (result.success > 0) {
        window.dispatchEvent(
          new CustomEvent('attendance-synced', { detail: result })
        )
      }
      await requestBackgroundSync()
    } finally {
      setIsSyncing(false)
    }
  }, [isSyncing])

  const refreshQueueCount = useCallback(() => {
    setQueueCount(getOfflineQueue().length)
  }, [])

  return {
    online,
    queueCount,
    isSyncing,
    syncNow,
    refreshQueueCount,
  }
}
