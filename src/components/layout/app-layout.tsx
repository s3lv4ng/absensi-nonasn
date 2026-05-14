'use client'

import { useEffect } from 'react'
import { useAuthStore, useAppStore } from '@/store'
import { AppSidebar } from '@/components/layout/sidebar'
import { AppHeader } from '@/components/layout/header'
import { MobileNavbar } from '@/components/layout/mobile-navbar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuthStore()
  const { currentView, sidebarOpen, setSidebarOpen } = useAppStore()

  // Don't render the layout if user is not authenticated
  if (!isAuthenticated || !user) {
    return <>{children}</>
  }

  // Views that don't need the app layout (landing, login, register)
  const publicViews = ['landing', 'login', 'register']
  if (publicViews.includes(currentView)) {
    return <>{children}</>
  }

  return (
    <SidebarProvider
      open={sidebarOpen}
      onOpenChange={setSidebarOpen}
    >
      {/* Sidebar */}
      <AppSidebar />

      {/* Main content area */}
      <SidebarInset className="flex flex-col min-h-screen">
        {/* Header */}
        <AppHeader />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8 pb-20 md:pb-6 lg:pb-8">
            {children}
          </div>
        </main>

        {/* Sticky footer - hidden on mobile (navbar replaces it) */}
        <footer className="hidden md:block mt-auto border-t border-blue-100/50 dark:border-blue-900/30 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
          <div className="px-4 sm:px-6 py-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
              <p>&copy; 2024 Sistem Absensi Pegawai</p>
              <p className="flex items-center gap-1">
                <span className="inline-block size-1.5 rounded-full bg-[#1e40af] dark:bg-blue-400" />
                Semua hak dilindungi
              </p>
            </div>
          </div>
        </footer>
      </SidebarInset>

      {/* Mobile Bottom Navbar */}
      <MobileNavbar />
    </SidebarProvider>
  )
}
