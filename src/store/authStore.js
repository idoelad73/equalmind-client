import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Session state. The refresh token lives in an httpOnly cookie set by the
 * server and is deliberately not reachable from here.
 */
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setSession: ({ user, accessToken }) => set({ user, accessToken }),
      clear: () => set({ user: null, accessToken: null }),
    }),
    {
      name: 'equalmind.auth',
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken }),
    },
  ),
)

export const selectIsAuthenticated = (state) => Boolean(state.accessToken)
