import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { LANDING_VARS } from '@/pages/landingPalettes'

export function AppLayout() {
  return (
    <div style={LANDING_VARS} className="min-h-screen bg-slate-50">
      <Sidebar />

      {/*
        ms-72 matches the panel's w-72. A logical margin, not ml/mr: in
        Hebrew the panel is on the right, and a physical margin would push
        the page away from the wrong edge.

        Only from lg, where the panel is fixed in view. Below that it is a
        drawer over the page and the content uses the full width.
      */}
      <div className="lg:ms-72">
        <main className="mx-auto max-w-5xl px-4 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
