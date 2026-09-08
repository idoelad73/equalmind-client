import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { LandingIndex } from '@/pages/landing/LandingIndex'
import { LandingA } from '@/pages/landing/LandingA'
import { LandingB } from '@/pages/landing/LandingB'
import { LandingC } from '@/pages/landing/LandingC'

// Recharts is heavy; keep it out of the initial bundle.
const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const CoachPage = lazy(() =>
  import('@/pages/CoachPage').then((m) => ({ default: m.CoachPage })),
)

function Lazy({ children }) {
  return (
    <Suspense fallback={<div className="py-12 text-sm text-slate-500">טוען…</div>}>
      {children}
    </Suspense>
  )
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: 'coach',
        element: (
          <Lazy>
            <CoachPage />
          </Lazy>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <Lazy>
            <DashboardPage />
          </Lazy>
        ),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  { path: '/login', element: <LoginPage /> },

  // Landing directions under review - full-bleed, outside AppLayout.
  { path: '/landing', element: <LandingIndex /> },
  { path: '/landing/a', element: <LandingA /> },
  { path: '/landing/b', element: <LandingB /> },
  { path: '/landing/c', element: <LandingC /> },
])
