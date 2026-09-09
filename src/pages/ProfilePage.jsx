import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Building2, Check, Loader2, Mail, ShieldCheck, UserRound } from 'lucide-react'
import { OrgAutocomplete } from '@/components/ui/OrgAutocomplete'
import { fetchMyProfile, saveAffiliation } from '@/lib/registryApi'
import { useAuthStore } from '@/store/authStore'

const PROVIDER_LABELS = {
  email: 'אימייל וסיסמה',
  google: 'חשבון Google',
}

const TYPE_LABELS = {
  regular: 'משתמש/ת רגיל/ה',
  org_admin: 'מנהל/ת מערכת ארגונית',
}

export function ProfilePage() {
  const user = useAuthStore((state) => state.user)

  const profile = useQuery({ queryKey: ['profile'], queryFn: fetchMyProfile })

  const [organization, setOrganization] = useState(null)
  const [dirty, setDirty] = useState(false)

  // Seed the picker once the stored affiliation arrives.
  useEffect(() => {
    const p = profile.data
    if (!p?.org_name) return
    setOrganization({
      name: p.org_name,
      registryId: p.org_registry_id ?? null,
      source: p.org_registry_source ?? null,
    })
  }, [profile.data])

  const save = useMutation({
    mutationFn: () => saveAffiliation(organization),
    onSuccess: () => {
      setDirty(false)
      profile.refetch()
    },
  })

  return (
    <section className="flex max-w-2xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">פרופיל</h1>
        <p className="mt-1 text-sm text-slate-600">פרטי החשבון שלך.</p>
      </div>

      <dl className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        <Row icon={Mail} label="כתובת אימייל" value={profile.data?.email ?? user?.email ?? '—'} ltr />
        <Row
          icon={UserRound}
          label="אופן ההתחברות"
          value={PROVIDER_LABELS[user?.provider] ?? user?.provider ?? '—'}
        />
        <Row
          icon={ShieldCheck}
          label="סוג חשבון"
          value={TYPE_LABELS[profile.data?.user_type] ?? '—'}
        />
      </dl>

      {/* Affiliation is optional and self-declared: it is never verified, and
          nothing about it grants access. */}
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold text-slate-900">
          <Building2 size={17} className="text-[var(--l-primary)]" aria-hidden="true" />
          מקום העבודה שלי
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          אופציונלי. עוזר לנו לשייך דיווחים למרחב הנכון. אפשר לשנות או להסיר בכל עת.
        </p>

        <div className="mt-4">
          {profile.isPending ? (
            <p className="text-sm text-slate-500">טוען…</p>
          ) : (
            <OrgAutocomplete
              label="ארגון"
              value={organization}
              allowManual
              hint="אפשר לבחור מהמרשם או להקליד שם חופשי."
              onChange={(next) => {
                setOrganization(next)
                setDirty(true)
              }}
            />
          )}
        </div>

        {save.error && (
          <p role="alert" className="mt-3 text-sm text-red-700">
            שמירת הארגון נכשלה. נסה/י שוב.
          </p>
        )}

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            disabled={!dirty || save.isPending}
            onClick={() => save.mutate()}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--l-primary)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--l-primary-hover)] disabled:opacity-50"
          >
            {save.isPending && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
            שמירה
          </button>

          {!dirty && save.isSuccess && (
            <span className="inline-flex items-center gap-1 text-sm text-[var(--l-primary)]">
              <Check size={15} aria-hidden="true" />
              נשמר
            </span>
          )}
        </div>
      </div>

      <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-500">
        <ShieldCheck
          size={14}
          className="mt-0.5 shrink-0 text-[var(--l-primary)]"
          aria-hidden="true"
        />
        <span>
          הדיווחים שלך אינם נשמרים לצד החשבון הזה. אין דרך לקשר בין דיווח לבין
          המשתמש שכתב אותו — גם לא מתוך מסד הנתונים.
        </span>
      </p>
    </section>
  )
}

function Row({ icon: Icon, label, value, ltr = false }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5">
      <Icon size={16} className="shrink-0 text-slate-400" aria-hidden="true" />
      <dt className="w-40 shrink-0 text-sm text-slate-500">{label}</dt>
      <dd
        className="truncate text-sm font-medium text-slate-900"
        {...(ltr ? { dir: 'ltr' } : {})}
      >
        {value}
      </dd>
    </div>
  )
}
