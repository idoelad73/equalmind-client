import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Building2, Check, KeyRound, Loader2, Smartphone, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { OrgAutocomplete } from '@/components/ui/OrgAutocomplete'
import {
  claimByPhone,
  clearAffiliation,
  joinByCode,
  saveAffiliation,
} from '@/lib/registryApi'

const SOURCE_LABELS = {
  roster: 'שויכת על ידי הארגון',
  code: 'הצטרפת עם קוד הארגון',
  declared: 'הצהרת על מקום העבודה בעצמך',
}

/**
 * The three ways a user ends up attached to an organisation, in one place.
 *
 * They are shown in order of authority - phone, then code, then declaring a
 * workplace by hand - because that is the order in which they are trusted,
 * and because the first two are the ones we want people to use.
 *
 * When the link came from a roster or a code, the picker is not offered at
 * all. The server would refuse the change anyway, and offering a control
 * that silently does nothing is worse than not offering it.
 */
export function OrgLinkCard({ profile, onChanged }) {
  const linked = Boolean(profile?.org_name || profile?.org_source)
  const asserted = profile?.org_source === 'roster' || profile?.org_source === 'code'

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="flex items-center gap-2 text-[15px] font-semibold text-slate-900">
        <Building2 size={17} className="text-[var(--l-primary)]" aria-hidden="true" />
        מקום העבודה שלי
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-slate-600">
        עוזר לנו לשייך דיווחים למרחב הנכון. הארגון לעולם לא יידע מי שלח דיווח.
      </p>

      {linked && <CurrentLink profile={profile} onChanged={onChanged} />}

      {!asserted && (
        <div className="mt-5 flex flex-col gap-5">
          <PhoneClaim profile={profile} onChanged={onChanged} />
          <Divider />
          <CodeJoin onChanged={onChanged} />
          <Divider />
          <SelfDeclare profile={profile} onChanged={onChanged} />
        </div>
      )}
    </div>
  )
}

const Divider = () => (
  <div className="flex items-center gap-3">
    <span className="h-px flex-1 bg-slate-200" />
    <span className="text-xs text-slate-400">או</span>
    <span className="h-px flex-1 bg-slate-200" />
  </div>
)

/* ------------------------------------------------------------- the link */

function CurrentLink({ profile, onChanged }) {
  const detach = useMutation({ mutationFn: clearAffiliation, onSuccess: onChanged })

  return (
    <div className="mt-4 flex items-start gap-3 rounded-lg bg-[var(--l-soft)]/50 p-4 ring-1 ring-[var(--l-ring)]">
      <Check size={16} className="mt-0.5 shrink-0 text-[var(--l-primary)]" aria-hidden="true" />
      <div className="flex-1">
        <p className="text-[15px] font-medium text-slate-900">
          {profile.org_name ?? 'ארגון מקושר'}
        </p>
        {profile.org_source && (
          <p className="mt-0.5 text-xs text-slate-500">{SOURCE_LABELS[profile.org_source]}</p>
        )}
      </div>
      <button
        type="button"
        disabled={detach.isPending}
        onClick={() => detach.mutate()}
        className="shrink-0 rounded-full p-1 text-slate-400 transition-colors hover:bg-white hover:text-slate-700 disabled:opacity-50"
        aria-label="ניתוק מהארגון"
      >
        {detach.isPending ? (
          <Loader2 size={15} className="animate-spin" aria-hidden="true" />
        ) : (
          <X size={15} aria-hidden="true" />
        )}
      </button>
    </div>
  )
}

/* ------------------------------------------------------------ 1. phone */

function PhoneClaim({ profile, onChanged }) {
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [note, setNote] = useState(null)

  const claim = useMutation({
    mutationFn: () => claimByPhone(phone),
    onSuccess: (data) => {
      setNote(
        data.matched
          ? { tone: 'ok', text: `שויכת ל${data.organization.name}.` }
          : {
              tone: 'info',
              text: 'המספר נשמר, אך הוא אינו מופיע ברשימה של אף ארגון. אפשר להצטרף עם קוד.',
            },
      )
      onChanged()
    },
    onError: (error) => setNote({ tone: 'error', text: error?.message ?? 'השיוך נכשל.' }),
  })

  return (
    <div>
      <label htmlFor="org-phone" className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
        <Smartphone size={15} className="text-slate-400" aria-hidden="true" />
        מספר נייד
      </label>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">
        אם הארגון שלך העלה רשימת עובדים, המספר ישייך אותך אליו אוטומטית. המספר
        נשמר אצלנו בלבד ואינו נחשף לארגון.
      </p>

      <div className="mt-2 flex gap-2">
        <input
          id="org-phone"
          type="tel"
          dir="ltr"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          placeholder="050-1234567"
          disabled={claim.isPending}
          onChange={(event) => {
            setPhone(event.target.value)
            setNote(null)
          }}
          className="h-10 flex-1 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-[var(--l-primary)]"
        />
        <button
          type="button"
          disabled={!phone.trim() || claim.isPending}
          onClick={() => claim.mutate()}
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-[var(--l-primary)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--l-primary-hover)] disabled:opacity-50"
        >
          {claim.isPending && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
          שיוך
        </button>
      </div>

      <Note note={note} />
    </div>
  )
}

/* ------------------------------------------------------------- 2. code */

function CodeJoin({ onChanged }) {
  const [code, setCode] = useState('')
  const [note, setNote] = useState(null)

  const join = useMutation({
    mutationFn: () => joinByCode(code),
    onSuccess: (data) => {
      setNote({ tone: 'ok', text: `הצטרפת ל${data.organization.name}.` })
      setCode('')
      onChanged()
    },
    onError: (error) => setNote({ tone: 'error', text: error?.message ?? 'ההצטרפות נכשלה.' }),
  })

  return (
    <div>
      <label htmlFor="org-code" className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
        <KeyRound size={15} className="text-slate-400" aria-hidden="true" />
        קוד הצטרפות
      </label>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">
        קוד שמנהל.ת המערכת בארגון שלך יכול.ה למסור לך.
      </p>

      <div className="mt-2 flex gap-2">
        <input
          id="org-code"
          type="text"
          dir="ltr"
          autoComplete="off"
          value={code}
          placeholder="ABCD-1234"
          disabled={join.isPending}
          onChange={(event) => {
            setCode(event.target.value)
            setNote(null)
          }}
          className="h-10 flex-1 rounded-lg border border-slate-300 px-3 font-mono text-sm tracking-wider text-slate-900 uppercase outline-none transition-colors focus:border-[var(--l-primary)]"
        />
        <button
          type="button"
          disabled={!code.trim() || join.isPending}
          onClick={() => join.mutate()}
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-[var(--l-primary)] px-4 text-sm font-semibold text-[var(--l-primary)] transition-colors hover:bg-[var(--l-soft)] disabled:opacity-50"
        >
          {join.isPending && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
          הצטרפות
        </button>
      </div>

      <Note note={note} />
    </div>
  )
}

/* --------------------------------------------------------- 3. declared */

function SelfDeclare({ profile, onChanged }) {
  const [organization, setOrganization] = useState(
    profile?.org_name
      ? {
          name: profile.org_name,
          registryId: profile.org_registry_id ?? null,
          source: profile.org_registry_source ?? null,
        }
      : null,
  )
  const [dirty, setDirty] = useState(false)

  const save = useMutation({
    mutationFn: () => saveAffiliation(organization),
    onSuccess: () => {
      setDirty(false)
      onChanged()
    },
  })

  return (
    <div>
      <span className="text-sm font-medium text-slate-900">בחירה ידנית</span>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">
        הצהרה בלבד. היא אינה מאומתת ואינה מעניקה הרשאות.
      </p>

      <div className="mt-2">
        <OrgAutocomplete
          label=""
          value={organization}
          allowManual
          onChange={(next) => {
            setOrganization(next)
            setDirty(true)
          }}
        />
      </div>

      {save.error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          שמירת הארגון נכשלה. נסה/י שוב.
        </p>
      )}

      <button
        type="button"
        disabled={!dirty || save.isPending}
        onClick={() => save.mutate()}
        className="mt-3 inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
      >
        {save.isPending && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
        שמירה
      </button>
    </div>
  )
}

function Note({ note }) {
  if (!note) return null
  return (
    <p
      role={note.tone === 'error' ? 'alert' : undefined}
      className={cn(
        'mt-2 text-sm',
        note.tone === 'error' && 'text-red-700',
        note.tone === 'ok' && 'text-[var(--l-primary)]',
        note.tone === 'info' && 'text-slate-600',
      )}
    >
      {note.text}
    </p>
  )
}
