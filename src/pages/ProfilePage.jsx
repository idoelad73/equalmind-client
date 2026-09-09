import { Mail, ShieldCheck, UserRound } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const PROVIDER_LABELS = {
  email: 'אימייל וסיסמה',
  google: 'חשבון Google',
}

export function ProfilePage() {
  const user = useAuthStore((state) => state.user)

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">פרופיל</h1>
        <p className="mt-1 text-sm text-slate-600">פרטי החשבון שלך.</p>
      </div>

      <dl className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        <Row icon={Mail} label="כתובת אימייל" value={user?.email ?? '—'} />
        <Row
          icon={UserRound}
          label="אופן ההתחברות"
          value={PROVIDER_LABELS[user?.provider] ?? user?.provider ?? '—'}
        />
      </dl>

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

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5">
      <Icon size={16} className="shrink-0 text-slate-400" aria-hidden="true" />
      <dt className="w-40 shrink-0 text-sm text-slate-500">{label}</dt>
      <dd className="truncate text-sm font-medium text-slate-900" dir="ltr">
        {value}
      </dd>
    </div>
  )
}
