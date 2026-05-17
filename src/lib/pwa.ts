// PWA utilities - service worker registration, offline queue, sync

const OFFLINE_QUEUE_KEY = 'absensi_offline_queue'

export interface QueuedAttendance {
  id: string
  timestamp: number
  data: {
    type: string
    latitude: number
    longitude: number
    photo?: string | null
    confidence: number
    officeId?: string
    faceVerified: boolean
    status?: string
  }
}

// Register service worker
export function registerServiceWorker() {
  if (typeof window === 'undefined') return
  if (!('serviceWorker' in navigator)) return

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('SW registered:', registration.scope)

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content available
              console.log('New content available; please refresh.')
            }
          })
        }
      })

      // Listen for sync messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'SYNC_ATTENDANCE') {
          processOfflineQueue()
        }
      })
    } catch (error) {
      console.error('SW registration failed:', error)
    }
  })
}

// Queue attendance data for offline sync
export function queueAttendance(data: QueuedAttendance['data']): QueuedAttendance {
  const queue = getOfflineQueue()
  const item: QueuedAttendance = {
    id: `offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    data,
  }
  queue.push(item)
  saveOfflineQueue(queue)
  return item
}

// Get the offline queue
export function getOfflineQueue(): QueuedAttendance[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(OFFLINE_QUEUE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Save the offline queue
function saveOfflineQueue(queue: QueuedAttendance[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue))
}

// Remove an item from the queue
export function removeFromQueue(itemId: string) {
  const queue = getOfflineQueue().filter((item) => item.id !== itemId)
  saveOfflineQueue(queue)
}

// Process the offline queue — try to submit each item
export async function processOfflineQueue(): Promise<{ success: number; failed: number }> {
  const queue = getOfflineQueue()
  if (queue.length === 0) return { success: 0, failed: 0 }

  let success = 0
  let failed = 0

  for (const item of queue) {
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.data),
      })

      if (res.ok) {
        removeFromQueue(item.id)
        success++
      } else {
        failed++
      }
    } catch {
      failed++
    }
  }

  return { success, failed }
}

// Check if the device is online
export function isOnline(): boolean {
  if (typeof window === 'undefined') return true
  return navigator.onLine
}

// Request background sync (if supported)
export async function requestBackgroundSync() {
  if (typeof window === 'undefined') return
  if (!('serviceWorker' in navigator)) return

  try {
    const registration = await navigator.serviceWorker.ready
    if ('sync' in registration) {
      await (registration as unknown as { sync: { register: (tag: string) => Promise<void> } }).sync.register('sync-attendance')
    }
  } catch (error) {
    console.error('Background sync registration failed:', error)
  }
}
