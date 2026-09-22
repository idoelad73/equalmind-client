import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { JoinCodePanel } from '@/components/org/JoinCodePanel'
import { NotifyModal } from '@/components/org/NotifyModal'

// Placeholder figures so the chart renders while the API is being built.
const SAMPLE = [
  { domain: 'מרחב עבודה', count: 0 },
  { domain: 'מרחב קהילה', count: 0 },
  { domain: 'מרחב צריכה', count: 0 },
]

export function DashboardPage() {
  const [notifyOpen, setNotifyOpen] = useState(false)

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">לוח בקרה</h1>
        <p className="mt-1 text-sm text-slate-600">
          נתוני דוגמה — יוחלפו בנתונים מהשרת.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setNotifyOpen(true)}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--l-primary)] px-5 text-[15px] font-semibold text-white transition-colors hover:bg-[var(--l-primary-hover)]"
        >
          <MessageSquare size={17} aria-hidden="true" />
          שליחת הזמנות לעובדים
        </button>
        <p className="text-xs text-slate-500">
          נשלח רק למי שטרם נרשם/ה. אפשר לערוך את נוסח ההודעה לפני השליחה.
        </p>
      </div>

      <JoinCodePanel />

      <NotifyModal open={notifyOpen} onClose={() => setNotifyOpen(false)} />

      <div className="h-72 rounded-lg border border-slate-200 bg-white p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={SAMPLE}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="domain" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#17505e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
