import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Check, Copy, KeyRound, Loader2, RefreshCw, Users } from 'lucide-react'
import { fetchJoinCode, rotateJoinCode } from '@/lib/registryApi'

/**
 * The organisation's join code and roster progress, for its admin.
 *
 * Rotating is safe and says so: people already attached stay attached,
 * because the code is checked once when someone joins and never again. An
 * admin who is unsure whether rotating will cut off their staff will never
 * rotate, which is how a leaked code stays live for years.
 */
export function JoinCodePanel() {
  const [copied, setCopied] = useState(false)

  const info = useQuery({
    queryKey: ['join-code'],
    queryFn: fetchJoinCode,
    // A regular user reaching this page gets a 403; that is not an error
    // worth retrying.
    retry: false,
  })

  const rotate = useMutation({
    mutationFn: rotateJoinCode,
    onSuccess: () => {
      setCopied(false)
      info.refetch()
    },
  })

  if (info.isError) return null
  if (info.isPending) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500">
        <Loader2 size={15} className="animate-spin" aria-hidden="true" />
        טוען…
      </div>
    )
  }

  const { joinCode, roster, attached, organization } = info.data

  async function copy() {
    try {
      await navigator.clipboard.writeText(joinCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access can be refused; the code is on screen regardless.
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="flex items-center gap-2 text-[15px] font-semibold text-slate-900">
        <KeyRound size={17} className="text-[var(--l-primary)]" aria-hidden="true" />
        קוד הצטרפות — <bdi>{organization}</bdi>
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-slate-600">
        עובדים שאינם ברשימה שהעלית יכולים להצטרף עם הקוד הזה מדף הפרופיל שלהם.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {joinCode ? (
          <code
            dir="ltr"
            className="rounded-lg bg-slate-100 px-4 py-2.5 font-mono text-lg font-bold tracking-widest text-slate-900"
          >
            {joinCode}
          </code>
        ) : (
          <span className="text-sm text-slate-500">עדיין לא הונפק קוד.</span>
        )}

        {joinCode && (
          <button
            type="button"
            onClick={copy}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            {copied ? (
              <Check size={15} className="text-[var(--l-primary)]" aria-hidden="true" />
            ) : (
              <Copy size={15} aria-hidden="true" />
            )}
            {copied ? 'הועתק' : 'העתקה'}
          </button>
        )}

        <button
          type="button"
          disabled={rotate.isPending}
          onClick={() => rotate.mutate()}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
        >
          {rotate.isPending ? (
            <Loader2 size={15} className="animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw size={15} aria-hidden="true" />
          )}
          {joinCode ? 'החלפת קוד' : 'הנפקת קוד'}
        </button>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        החלפת הקוד אינה מנתקת אף אחד. הקוד נבדק פעם אחת, ברגע ההצטרפות.
      </p>

      <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-2 border-t border-slate-200 pt-4">
        <Stat icon={Users} label="ברשימה שהועלתה" value={roster.listed} />
        <Stat icon={Check} label="מתוכם נרשמו" value={roster.claimed} />
        <Stat icon={Users} label="משויכים לארגון" value={attached} />
      </dl>
    </div>
  )
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={15} className="text-slate-400" aria-hidden="true" />
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-sm font-semibold text-slate-900">{value}</dd>
    </div>
  )
}
