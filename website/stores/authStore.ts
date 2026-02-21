import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'

type Action = 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'publish' | 'verify' | 'change_role' | 'deactivate' | 'approve_bid' | 'approve_loan' | 'assign'

const PERMISSIONS: Record<string, Record<string, Action[]>> = {
  admin: {
    users: ['view', 'create', 'edit', 'delete', 'change_role', 'deactivate'],
    content: ['view', 'create', 'edit', 'delete', 'approve', 'publish'],
    donations: ['view', 'verify'],
    auctions: ['view', 'create', 'edit', 'delete', 'approve_bid'],
    bookings: ['view', 'approve', 'assign'],
    equipment: ['view', 'create', 'edit', 'delete', 'approve_loan'],
    finance: ['view', 'create', 'edit', 'publish'],
  },
  pengurus: {
    users: ['view'],
    content: ['view', 'create', 'edit', 'approve', 'publish'],
    donations: ['view', 'verify'],
    auctions: ['view', 'approve_bid'],
    bookings: ['view', 'approve', 'assign'],
    equipment: ['view', 'approve_loan'],
    finance: ['view'],
  },
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  setAuth: (user: User, accessToken: string, refreshToken: string) => void
  clearAuth: () => void
  isAuthenticated: boolean
  can: (action: Action, resource: string) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => {
        set({ user, accessToken, refreshToken, isAuthenticated: true })
        // Also set cookie for middleware SSR checks
        if (typeof document !== 'undefined') {
          document.cookie = `access_token=${accessToken}; path=/; max-age=900; SameSite=Strict`
        }
      },

      clearAuth: () => {
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
        if (typeof document !== 'undefined') {
          document.cookie = 'access_token=; path=/; max-age=0'
        }
      },

      can: (action, resource) => {
        const { user } = get()
        if (!user) return false
        const rolePerms = PERMISSIONS[user.role]
        if (!rolePerms) return false
        const resourcePerms = rolePerms[resource]
        if (!resourcePerms) return false
        return resourcePerms.includes(action)
      },
    }),
    {
      name: 'yski-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
