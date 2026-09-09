import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { paths } from './paths'

/** Shown only while the session is still being resolved. */
function Resolving() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <span className="text-sm text-slate-500">טוען…</span>
    </div>
  )
}

/**
 * Protects the signed-in application.
 *
 * While the session is unresolved this waits rather than redirecting - the
 * Google callback lands here with tokens in the URL fragment and an empty
 * store, and an early redirect would discard a successful sign-in. A user
 * returning with a stored token skips the wait so navigation stays instant.
 */
export function RequireAuth({ children }) {
  const status = useAuthStore((state) => state.status)
  const hasStoredToken = useAuthStore((state) => Boolean(state.accessToken))
  const location = useLocation()

  if (status === 'authenticated') return children
  if (status === 'loading') return hasStoredToken ? children : <Resolving />
  return <Navigate to={paths.landing} replace state={{ from: location.pathname }} />
}

/**
 * For the public pages. Anonymous visitors see them immediately - a landing
 * page must never wait on an auth check - while a signed-in user is sent
 * straight into the app.
 */
export function RedirectIfAuthenticated({ children }) {
  const status = useAuthStore((state) => state.status)
  const hasStoredToken = useAuthStore((state) => Boolean(state.accessToken))

  const signedIn =
    status === 'authenticated' || (status === 'loading' && hasStoredToken)

  return signedIn ? <Navigate to={paths.app} replace /> : children
}
