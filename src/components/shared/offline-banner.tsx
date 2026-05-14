'use client'

import { useOnlineStatus } from '@/hooks/use-online-status'
import { Wifi, WifiOff, RefreshCw, CloudOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'

export function OfflineBanner() {
  const { online, queueCount, isSyncing, syncNow } = useOnlineStatus()

  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <WifiOff className="size-4" />
              <span className="text-sm font-medium">Mode Offline</span>
              {queueCount > 0 && (
                <Badge variant="secondary" className="bg-white/20 text-white text-[10px] px-1.5 py-0">
                  <CloudOff className="size-3 mr-0.5" />
                  {queueCount} antrian
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={syncNow}
              disabled={isSyncing}
              className="text-white hover:bg-white/20 h-7 text-xs"
            >
              <RefreshCw className={`size-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Menyinkronkan...' : 'Sinkronkan'}
            </Button>
          </div>
        </motion.div>
      )}

      {online && queueCount > 0 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="bg-teal-500 text-white px-4 py-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Wifi className="size-4" />
              <span className="text-sm font-medium">Online — {queueCount} data menunggu sinkronisasi</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={syncNow}
              disabled={isSyncing}
              className="text-white hover:bg-white/20 h-7 text-xs"
            >
              <RefreshCw className={`size-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
