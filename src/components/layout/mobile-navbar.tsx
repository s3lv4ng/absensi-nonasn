'use client'

import { useAuthStore, useAppStore } from '@/store'
import type { AppView } from '@/types'
import {
  LayoutDashboard,
  Fingerprint,
  ClipboardCheck,
  History,
  UserCircle,
  Eye,
  Cloud,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  title: string
  view: AppView
  icon: React.ComponentType<{ className?: string }>
}

const employeeNavItems: NavItem[] = [
  {
    title: 'Home',
    view: 'employee-dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Monitor',
    view: 'employee-monitoring',
    icon: Eye,
  },
  {
    title: 'Absensi',
    view: 'employee-dashboard', // Will trigger the attendance dialog
    icon: Fingerprint,
  },
  {
    title: 'Pengajuan',
    view: 'employee-leaves',
    icon: ClipboardCheck,
  },
  {
    title: 'Profil',
    view: 'employee-profile',
    icon: UserCircle,
  },
]

const adminNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    view: 'admin-dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Pegawai',
    view: 'admin-employees',
    icon: Fingerprint,
  },
  {
    title: 'Izin/Cuti',
    view: 'admin-leaves',
    icon: ClipboardCheck,
  },
  {
    title: 'File',
    view: 'admin-file-manager',
    icon: Cloud,
  },
  {
    title: 'Setting',
    view: 'admin-settings',
    icon: UserCircle,
  },
]
export function MobileNavbar() {
  const { user, hasRole } = useAuthStore()
  const { currentView, setCurrentView } = useAppStore()

  const isAdmin = hasRole('ADMIN')
  const navItems = isAdmin ? adminNavItems : employeeNavItems

  // Special handling for the "Absensi" button in employee nav
  // It highlights when on employee-dashboard
  const isActive = (view: AppView) => {
    return currentView === view
  }

  const handleClick = (item: NavItem) => {
    setCurrentView(item.view)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden safe-area-bottom">
      {/* Glassmorphism background */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-blue-100/50 dark:border-blue-900/30">
        {/* Active indicator bar */}
        <div className="flex items-center justify-around px-1 pt-1 pb-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.view)

            return (
              <button
                key={item.title}
                onClick={() => handleClick(item)}
                className={cn(
                  'flex flex-col items-center justify-center py-1.5 px-2 min-w-[56px] rounded-xl transition-all duration-200 relative',
                  active
                    ? 'text-[#1e40af] dark:text-blue-400'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'
                )}
              >
                {/* Active background glow */}
                {active && (
                  <div className="absolute inset-0 bg-blue-50 dark:bg-blue-950/50 rounded-xl" />
                )}

                {/* Active top indicator */}
                {active && (
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-[#1e40af] dark:bg-blue-400" />
                )}

                <div className="relative">
                  <Icon
                    className={cn(
                      'size-5 transition-all duration-200',
                      active ? 'scale-110' : 'scale-100'
                    )}
                  />
                </div>

                <span
                  className={cn(
                    'text-[10px] mt-0.5 font-medium leading-tight transition-all duration-200 relative',
                    active ? 'text-[#1e40af] dark:text-blue-400' : ''
                  )}
                >
                  {item.title}
                </span>
              </button>
            )
          })}
        </div>

        {/* Safe area spacing for iPhone notch devices */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </nav>
  )
}
