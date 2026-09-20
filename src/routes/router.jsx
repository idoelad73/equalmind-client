import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { HomePage } from '@/pages/HomePage'
import { SpacePage } from '@/pages/SpacePage'
import { ReportDetailsPage } from '@/pages/ReportDetailsPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { AboutPage } from '@/pages/AboutPage'
import { AuthPage } from '@/pages/AuthPage'
import { LandingPage } from '@/pages/LandingPage'
import { InviteAcceptPage } from '@/pages/InviteAcceptPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

import { paths, appSegments } from './paths'
import { RequireAuth, RedirectIfAuthenticated } from './guards'

// Recharts is heavy; keep it out of the initial bundle.
const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const CoachPage = lazy(() =>
  import('@/pages/CoachPage').then((m) => ({ default: m.CoachPage })),
)

function Lazy({ children }) {
  return (
    <Suspense
      fallback={<div className="py-12 text-sm text-[var(--l-muted)]">טוען…</div>}
    >
      {children}
    </Suspense>
  )
}

/** Public pages redirect a signed-in visitor straight into the app. */
const publicOnly = (element) => (
  <RedirectIfAuthenticated>{element}</RedirectIfAuthenticated>
)

export const router = createBrowserRouter([
  { path: paths.landing, element: publicOnly(<LandingPage />) },
  { path: paths.login, element: publicOnly(<AuthPage mode="login" />) },
  { path: paths.register, element: publicOnly(<AuthPage mode="register" />) },

  // NOT publicOnly: an invitee arrives already holding a session, and that
  // guard would bounce them into the app before they set a password.
  { path: paths.inviteAccept, element: <InviteAcceptPage /> },

  {
    path: paths.app,
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: appSegments.space, element: <SpacePage /> },
      { path: appSegments.reportDetails, element: <ReportDetailsPage /> },
      { path: appSegments.profile, element: <ProfilePage /> },
      { path: appSegments.about, element: <AboutPage /> },
      {
        path: appSegments.coach,
        element: (
          <Lazy>
            <CoachPage />
          </Lazy>
        ),
      },
      {
        path: appSegments.dashboard,
        element: (
          <Lazy>
            <DashboardPage />
          </Lazy>
        ),
      },
      // Unknown path inside the app keeps the navigation bar.
      { path: '*', element: <NotFoundPage /> },
    ],
  },

  // Preview path from earlier iterations.
  { path: '/landing', element: <Navigate to={paths.landing} replace /> },

  { path: '*', element: <NotFoundPage /> },
])
