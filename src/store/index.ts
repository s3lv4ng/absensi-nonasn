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
        // Not authenticated — check if setup is needed
        set({ user: null, isAuthenticated: false, isLoading: false, initialized: true })
        try {
          const setupRes = await fetch('/api/setup/status')
          if (setupRes.ok) {
            const setupData = await setupRes.json()
            if (setupData.needsSetup) {
              useAppStore.getState().setCurrentView('setup')
            }
          }
        } catch {
          // Ignore setup check errors — default to login
        }
      }
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false, initialized: true })
    }
  },
}))

interface AppIdentity {
  appName: string
  logoPath: string | null
  faviconPath: string | null
  pwaIcon192Path: string | null
  pwaIcon512Path: string | null
  officeName: string
  allowRegistration: boolean
}

interface AppStore {
  currentView: AppView
  sidebarOpen: boolean
  appIdentity: AppIdentity
  setCurrentView: (view: AppView) => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setAppIdentity: (identity: Partial<AppIdentity>) => void
  fetchAppIdentity: () => Promise<void>
}

const defaultIdentity: AppIdentity = {
  appName: 'Sistem Absensi Pegawai',
  logoPath: null,
  faviconPath: null,
  pwaIcon192Path: null,
  pwaIcon512Path: null,
  officeName: 'Kantor Pusat',
  allowRegistration: true,
}

export const useAppStore = create<AppStore>((set, get) => ({
  currentView: 'login',
  sidebarOpen: false,
  appIdentity: defaultIdentity,

  setCurrentView: (currentView) => set({ currentView }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
  setAppIdentity: (identity) => set((state) => ({
    appIdentity: { ...state.appIdentity, ...identity },
  })),
  fetchAppIdentity: async () => {
    try {
      const res = await fetch('/api/app-identity')
      if (res.ok) {
        const data = await res.json()
        set({
          appIdentity: {
            appName: data.appName || defaultIdentity.appName,
            logoPath: data.logoPath || null,
            faviconPath: data.faviconPath || null,
            pwaIcon192Path: data.pwaIcon192Path || null,
            pwaIcon512Path: data.pwaIcon512Path || null,
            officeName: data.officeName || defaultIdentity.officeName,
            allowRegistration: data.allowRegistration !== undefined ? data.allowRegistration : defaultIdentity.allowRegistration,
          },
        })
      }
    } catch {
      // Use defaults
    }
  },
}))
