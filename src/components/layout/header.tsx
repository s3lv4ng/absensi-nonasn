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
} from 'lucide-react'
import { useAuthStore, useAppStore } from '@/store'
import type { AppView } from '@/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarTrigger } from '@/components/ui/sidebar'

const viewTitles: Record<AppView, string> = {
  landing: 'Selamat Datang',
  login: 'Masuk',
  register: 'Daftar',
  'employee-dashboard': 'Dashboard',
  'employee-history': 'Riwayat Absensi',
  'employee-profile': 'Profil',
  'employee-leaves': 'Pengajuan Izin/Cuti',
  'admin-dashboard': 'Dashboard Admin',
  'admin-employees': 'Kelola Pegawai',
  'admin-attendance': 'Monitoring Absensi',
  'admin-settings': 'Pengaturan',
  'admin-reports': 'Laporan',
  'admin-leaves': 'Izin / Cuti / Dinas',
  'admin-offices': 'Lokasi Kantor',
  'admin-shifts': 'Jam Kerja',
  'admin-employee-report': 'Laporan Pegawai',
}

export function AppHeader() {
  const { user, hasRole, logout } = useAuthStore()
  const { currentView, toggleSidebar } = useAppStore()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [currentTime, setCurrentTime] = useState<string>('')
  const [currentDate, setCurrentDate] = useState<string>('')

  useEffect(() => {
    // Clock subscription — setState is in interval callback (external system subscription)
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

    // Initial update via setTimeout to avoid synchronous setState in effect body
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative size-8 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/50 text-[#1e40af] dark:text-blue-400"
            >
              <Bell className="size-4" />
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-gray-900">
                3
              </span>
              <span className="sr-only">Notifikasi</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifikasi</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-[#1e40af]/10 text-[#1e40af]">
                3 baru
              </Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-1 cursor-pointer">
              <span className="text-sm font-medium">Izin Cuti Baru</span>
              <span className="text-xs text-muted-foreground">Ahmad mengajukan izin cuti</span>
              <span className="text-[10px] text-muted-foreground">5 menit yang lalu</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 cursor-pointer">
              <span className="text-sm font-medium">Keterlambatan</span>
              <span className="text-xs text-muted-foreground">3 pegawai terlambat hari ini</span>
              <span className="text-[10px] text-muted-foreground">1 jam yang lalu</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 cursor-pointer">
              <span className="text-sm font-medium">Absensi Selesai</span>
              <span className="text-xs text-muted-foreground">Laporan harian tersedia</span>
              <span className="text-[10px] text-muted-foreground">3 jam yang lalu</span>
            </DropdownMenuItem>
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
