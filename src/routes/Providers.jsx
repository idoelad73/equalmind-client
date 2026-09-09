import { useEffect } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/authApi'
import { useAuthStore } from '@/store/authStore'

/**
 * Keep the store in step with Supabase's own session: restores a session on
 * page load (which is also how the Google redirect completes) and follows
 * sign-in, sign-out and silent token refreshes for the life of the tab.
 */
function useSessionSync() {
  useEffect(() => {
    let active = true

    getSession().then((session) => {
      if (!active) return
      if (session) useAuthStore.getState().setSession(session)
      else useAuthStore.getState().clear()
    })

    if (!supabase) return () => { active = false }

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        useAuthStore.getState().clear()
        return
      }
      useAuthStore.getState().setSession({
        user: {
          id: session.user.id,
          email: session.user.email ?? null,
          provider: session.user.app_metadata?.provider ?? 'email',
        },
        accessToken: session.access_token,
      })
    })

    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])
}

export function Providers({ children }) {
  useSessionSync()
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
