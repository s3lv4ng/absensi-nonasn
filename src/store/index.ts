import { create } from 'zustand'
import type { User, AppView, Role } from '@/types'

interface AuthStore {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  initialized: boolean
  setUser: (user: User | null) => void
  setLoading: (isLoading: boolean) => void
  login: (user: User) => void
  logout: () => Promise<void>
  hasRole: (role: Role) => boolean
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  initialized: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (isLoading) => set({ isLoading }),

  login: (user) => set({ user, isAuthenticated: true, isLoading: false, initialized: true }),

  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Ignore errors on logout
    }
    set({ user: null, isAuthenticated: false, isLoading: false })
    useAppStore.getState().setCurrentView('login')
  },

  hasRole: (role) => {
    const { user } = get()
    return user?.role === role
  },

  initialize: async () => {
    if (get().initialized) return
    set({ isLoading: true })
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        set({
          user: data.user,
          isAuthenticated: true,
          isLoading: false,
          initialized: true,
        })
        // Navigate to appropriate dashboard
        const appStore = useAppStore.getState()
        if (data.user.role === 'ADMIN') {
          appStore.setCurrentView('admin-dashboard')
        } else {
          appStore.setCurrentView('employee-dashboard')
        }
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false, initialized: true })
      }
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false, initialized: true })
    }
  },
}))

interface AppStore {
  currentView: AppView
  sidebarOpen: boolean
  setCurrentView: (view: AppView) => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
}

export const useAppStore = create<AppStore>((set, get) => ({
  currentView: 'login',
  sidebarOpen: false,

  setCurrentView: (currentView) => set({ currentView }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
}))
