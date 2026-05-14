'use client'

import { useEffect } from 'react'
import { useAuthStore, useAppStore } from '@/store'
import { AppLayout } from '@/components/layout/app-layout'
import { LoginForm } from '@/components/auth/login-form'
import { RegisterForm } from '@/components/auth/register-form'
import { EmployeeDashboard } from '@/components/employee/employee-dashboard'
import { AttendanceHistory } from '@/components/employee/attendance-history'
import { Profile } from '@/components/employee/profile'
import { AdminDashboard } from '@/components/admin/admin-dashboard'
import { EmployeeManagement } from '@/components/admin/employee-management'
import { AttendanceMonitoring } from '@/components/admin/attendance-monitoring'
import { AdminSettings } from '@/components/admin/settings'
import { AdminReports } from '@/components/admin/reports'
import { LeaveManagement } from '@/components/admin/leave-management'

function ViewRenderer() {
  const { currentView } = useAppStore()

  switch (currentView) {
    case 'login':
      return <LoginForm />
    case 'register':
      return <RegisterForm />
    case 'admin-dashboard':
      return <AdminDashboard />
    case 'admin-employees':
      return <EmployeeManagement />
    case 'admin-attendance':
      return <AttendanceMonitoring />
    case 'admin-settings':
      return <AdminSettings />
    case 'admin-reports':
      return <AdminReports />
    case 'admin-leaves':
      return <LeaveManagement />
    case 'employee-dashboard':
      return <EmployeeDashboard />
    case 'employee-history':
      return <AttendanceHistory />
    case 'employee-profile':
      return <Profile />
    default:
      return <LoginForm />
  }
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-12 w-12 rounded-xl bg-[#1e40af] flex items-center justify-center animate-pulse">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
            </svg>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[#1e40af] animate-bounce [animation-delay:-0.3s]" />
          <div className="h-2 w-2 rounded-full bg-[#1e40af] animate-bounce [animation-delay:-0.15s]" />
          <div className="h-2 w-2 rounded-full bg-[#1e40af] animate-bounce" />
        </div>
        <p className="text-sm text-muted-foreground">Memuat aplikasi...</p>
      </div>
    </div>
  )
}

export default function Home() {
  const { isAuthenticated, isLoading, initialized, initialize } = useAuthStore()
  const { currentView } = useAppStore()

  // Initialize auth on mount
  useEffect(() => {
    initialize()
  }, [initialize])

  // Show loading screen while checking auth
  if (isLoading && !initialized) {
    return <LoadingScreen />
  }

  const publicViews = ['login', 'register']
  const isPublicView = publicViews.includes(currentView)

  if (!isAuthenticated || isPublicView) {
    return <ViewRenderer />
  }

  return (
    <AppLayout>
      <ViewRenderer />
    </AppLayout>
  )
}
