'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import {
  Bell,
  Moon,
  Sun,
  LogOut,
  UserCircle,
  LayoutDashboard,
  Clock,
  CheckCheck,
  Trash2,
} from 'lucide-react'
import { useAuthStore, useAppStore } from '@/store'
import type { AppView } from '@/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { toast } from 'sonner'

const viewTitles: Record<AppView, string> = {
  landing: 'Selamat Datang',
  login: 'Masuk',
  register: 'Daftar',
  'employee-dashboard': 'Dashboard',
  'employee-history': 'Riwayat Absensi',
  'employee-profile': 'Profil',
  'employee-leaves': 'Pengajuan Izin/Cuti',
  'employee-monitoring': 'Monitor Kehadiran',
  'admin-dashboard': 'Dashboard Admin',
  'admin-employees': 'Kelola Pegawai',
  'admin-attendance': 'Monitoring Absensi',
  'admin-settings': 'Pengaturan',
  'admin-leaves': 'Izin / Cuti / Dinas',
  'admin-rekap-absen': 'Cetak Rekap Absen',
}

interface NotificationItem {
  id: string
  type: string
  title: string
  message: string
  time: string
  read: boolean
  relatedId?: string | null
}

export function AppHeader() {
  const { user, hasRole, logout } = useAuthStore()
  const { currentView, toggleSidebar, appIdentity } = useAppStore()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [currentTime, setCurrentTime] = useState<string>('')
  const [currentDate, setCurrentDate] = useState<string>('')
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifOpen, setNotifOpen] = useState(false)

  useEffect(() => {
    // Clock subscription
    const updateClock = () => {
      const now = new Date()
      setCurrentTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      )
      setCurrentDate(
        now.toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      )
    }

    const timeoutId = setTimeout(() => {
      updateClock()
      setMounted(true)
    }, 0)

    const interval = setInterval(updateClock, 1000)
    return () => {
      clearTimeout(timeoutId)
      clearInterval(interval)
    }
  }, [])

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch {
      // Silent fail
    }
  }

  useEffect(() => {
    if (!user) return
    const doFetch = () => { fetchNotifications() }
    const timeout = setTimeout(doFetch, 0)
    const interval = setInterval(doFetch, 60000) // Refresh every 60s
    return () => { clearTimeout(timeout); clearInterval(interval) }
  }, [user])

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllRead' }),
      })
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        setUnreadCount(0)
        toast.success('Semua notifikasi ditandai sudah dibaca')
      }
    } catch {
      toast.error('Gagal menandai notifikasi')
    }
  }

  // Clear all notifications
  const handleClearAll = async () => {
    try {
      const res = await fetch('/api/notifications?action=clearAll', {
        method: 'DELETE',
      })
      if (res.ok) {
        setNotifications([])
        setUnreadCount(0)
        toast.success('Semua notifikasi dihapus')
      }
    } catch {
      toast.error('Gagal menghapus notifikasi')
    }
  }

  // Mark single as read on click
  const handleNotifClick = async (notif: NotificationItem) => {
    if (!notif.read) {
      try {
        await fetch('/api/notifications', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'markRead', notificationId: notif.id }),
        })
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      } catch {
        // silent
      }
    }
  }

  const isAdmin = hasRole('ADMIN')
  const title = viewTitles[currentView] ?? 'Dashboard'

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Get notification icon/color based on type
  const getNotifStyle = (type: string) => {
    switch (type) {
      case 'leave':
        return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
      case 'late':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
      case 'attendance':
        return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-blue-100/50 dark:border-blue-900/30" />

      <div className="relative flex h-14 items-center gap-3 px-4 sm:px-6">
        {/* Mobile menu toggle */}
        <SidebarTrigger className="md:hidden" />

        {/* Page title */}
        <div className="flex-1 flex items-center gap-3">
          <div className="hidden sm:block">
            <h1 className="text-base font-bold text-[#1e3a8a] dark:text-blue-300 tracking-tight">
              {title}
            </h1>
          </div>
          <div className="sm:hidden">
            <h1 className="text-sm font-bold text-[#1e3a8a] dark:text-blue-300 tracking-tight truncate max-w-[140px]">
              {title}
            </h1>
          </div>
        </div>

        {/* Real-time clock */}
        {mounted && (
          <div className="hidden sm:flex items-center gap-2 rounded-lg bg-blue-50/80 dark:bg-blue-950/40 px-3 py-1.5 border border-blue-100/60 dark:border-blue-900/40">
            <Clock className="size-3.5 text-[#1e40af] dark:text-blue-400" />
            <div className="flex flex-col leading-none">
              <span className="text-xs font-semibold tabular-nums text-[#1e3a8a] dark:text-blue-300">
                {currentTime}
              </span>
              <span className="text-[10px] text-muted-foreground hidden lg:block">
                {currentDate}
              </span>
            </div>
          </div>
        )}

        {/* Dark mode toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="size-8 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/50 text-[#1e40af] dark:text-blue-400"
        >
          {mounted && (theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />)}
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* Notification bell */}
        <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative size-8 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/50 text-[#1e40af] dark:text-blue-400"
            >
              <Bell className="size-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-gray-900 animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
              <span className="sr-only">Notifikasi</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-blue-100/50 dark:border-blue-900/30">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Notifikasi</span>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-[#1e40af]/10 text-[#1e40af] dark:bg-blue-900/30 dark:text-blue-300">
                    {unreadCount} baru
                  </Badge>
                )}
              </div>
              {notifications.length > 0 && (
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1.5 text-[10px] text-[#1e40af] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                      onClick={handleMarkAllRead}
                    >
                      <CheckCheck className="size-3 mr-0.5" />
                      Baca Semua
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1.5 text-[10px] text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
                    onClick={handleClearAll}
                  >
                    <Trash2 className="size-3 mr-0.5" />
                    Hapus
                  </Button>
                </div>
              )}
            </div>

            {/* Notification list */}
            {notifications.length === 0 ? (
              <div className="py-6 text-center">
                <Bell className="size-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">Tidak ada notifikasi</p>
              </div>
            ) : (
              <ScrollArea className="max-h-[320px]">
                <div className="py-1">
                  {notifications.map((notif) => (
                    <button
                      key={notif.id}
                      className={`w-full text-left px-3 py-2.5 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-colors border-b border-blue-50/50 dark:border-blue-900/20 last:border-0 ${
                        !notif.read ? 'bg-blue-50/30 dark:bg-blue-950/20' : ''
                      }`}
                      onClick={() => handleNotifClick(notif)}
                    >
                      <div className="flex items-start gap-2">
                        {/* Unread dot */}
                        <div className="mt-1.5 shrink-0">
                          {!notif.read ? (
                            <span className="block size-2 rounded-full bg-[#1e40af] dark:bg-blue-400" />
                          ) : (
                            <span className="block size-2 rounded-full bg-transparent" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs leading-tight ${!notif.read ? 'font-semibold text-foreground' : 'font-medium text-foreground/80'}`}>
                            {notif.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                            {notif.message}
                          </p>
                          <p className="text-[10px] text-muted-foreground/60 mt-1">
                            {notif.time}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-8 gap-2 rounded-lg px-2 hover:bg-blue-50 dark:hover:bg-blue-950/50"
            >
              <Avatar className="h-7 w-7 ring-2 ring-[#1e40af]/20">
                <AvatarImage
                  src={user?.photo ?? undefined}
                  alt={user?.nama ?? 'User'}
                />
                <AvatarFallback className="bg-[#1e40af] text-white text-[10px] font-semibold">
                  {user?.nama ? getInitials(user.nama) : '??'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start text-left">
                <span className="text-xs font-semibold text-foreground leading-none">
                  {user?.nama ?? 'User'}
                </span>
                <span className="text-[10px] text-muted-foreground leading-none mt-0.5">
                  {isAdmin ? 'Administrator' : 'Pegawai'}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.nama}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                const appStore = useAppStore.getState()
                appStore.setCurrentView(isAdmin ? 'admin-dashboard' : 'employee-dashboard')
              }}
              className="cursor-pointer"
            >
              <LayoutDashboard className="mr-2 size-4" />
              Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                const appStore = useAppStore.getState()
                appStore.setCurrentView('employee-profile')
              }}
              className="cursor-pointer"
            >
              <UserCircle className="mr-2 size-4" />
              Profil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 size-4" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
