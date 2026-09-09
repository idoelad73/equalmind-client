import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { LANDING_VARS } from '@/pages/landingPalettes'

export function AppLayout() {
  return (
    <div style={LANDING_VARS} className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
