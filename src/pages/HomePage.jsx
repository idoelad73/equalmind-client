import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { useHealth } from '@/hooks/useHealth'

export function HomePage() {
  const { data, isPending, isError, error } = useHealth()

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">דיווחים</h1>
        <p className="mt-1 text-sm text-slate-600">
          תשתית הפרויקט מוכנה. מכאן נבנה את זרימת הדיווח.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-medium text-slate-500">חיבור לשרת</h2>
        <div className="mt-2 flex items-center gap-2 text-sm">
          {isPending && (
            <>
              <Loader2 size={16} className="animate-spin text-slate-400" aria-hidden="true" />
              <span className="text-slate-600">בודק…</span>
            </>
          )}
          {isError && (
            <>
              <AlertCircle size={16} className="text-red-600" aria-hidden="true" />
              <span className="text-red-700">{error.message}</span>
            </>
          )}
          {data && (
            <>
              <CheckCircle2 size={16} className="text-emerald-600" aria-hidden="true" />
              <span className="text-slate-700">
                {data.status} · DB: {data.db}
              </span>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
