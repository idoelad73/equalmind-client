import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Session state.
 *
 * `status` starts as 'loading' on every page load and is resolved by the
 * session sync in app/Providers.jsx. Guards must wait for it rather than
 * assume 'anonymous': a Google sign-in returns to /app with its tokens in the
 * URL fragment and nothing in storage yet, so redirecting early would bounce
 * the user out of a sign-in that actually succeeded.
 */
export const useAuthStore = create(
  persist(
    (set) => ({
      status: 'loading', // 'loading' | 'authenticated' | 'anonymous'
      user: null,
      accessToken: null,
      setSession: ({ user, accessToken }) =>
        set({ user, accessToken, status: 'authenticated' }),
      clear: () => set({ user: null, accessToken: null, status: 'anonymous' }),
    }),
    {
      name: 'equalmind.auth',
      // status is deliberately not persisted - it is re-derived each load.
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken }),
    },
  ),
)

export const selectIsAuthenticated = (state) => state.status === 'authenticated'
