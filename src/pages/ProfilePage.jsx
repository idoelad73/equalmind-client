import { useQuery } from '@tanstack/react-query'
import { Mail, ShieldCheck, Smartphone, UserRound } from 'lucide-react'
import { OrgLinkCard } from '@/components/org/OrgLinkCard'
import { fetchMyProfile } from '@/lib/registryApi'
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
          icon={Smartphone}
          label="מספר נייד"
          value={profile.data?.phone ?? '—'}
          ltr
        />
        <Row
          icon={ShieldCheck}
          label="סוג חשבון"
          value={TYPE_LABELS[profile.data?.user_type] ?? '—'}
        />
      </dl>

      <OrgLinkCard profile={profile.data} onChanged={() => profile.refetch()} />

      <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-500">
        <ShieldCheck
          size={14}
          className="mt-0.5 shrink-0 text-[var(--l-primary)]"
          aria-hidden="true"
        />
        <span>
          הדיווחים שלך אנונימיים כלפי הארגון. מנהל.ת המערכת הארגונית רואה
          את תוכן הדיווח בלבד, לעולם לא מי שלח אותו.
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
