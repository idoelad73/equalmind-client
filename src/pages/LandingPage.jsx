import { Link } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { GoogleMark } from '@/components/auth/GoogleMark'
import { loginWithGoogle } from '@/lib/authApi'
import { paths } from '@/routes/paths'
import { CommunityBackdrop, LinkedRings } from '@/components/decor/CommunityBackdrop'
import { LANDING_VARS } from './landingPalettes'

export function LandingPage() {
  const google = useMutation({ mutationFn: loginWithGoogle })

  return (
    <div style={LANDING_VARS} className="relative min-h-screen overflow-hidden bg-white">
      <CommunityBackdrop />

      <div className="relative mx-auto flex min-h-screen max-w-lg flex-col items-center px-6 py-14 text-center">
        <span className="text-3xl font-extrabold tracking-tight text-[var(--l-primary)] sm:text-4xl">
          Equalmind
        </span>

        <div className="mt-14">
          <p className="text-sm font-semibold tracking-wide text-[var(--l-eyebrow)]">
            כי המרחב הציבורי שייך לכולם
          </p>
          <h1 className="mt-3 text-[clamp(2rem,7vw,2.75rem)] font-extrabold leading-tight tracking-tight text-balance text-[var(--l-ink)]">
            מה שקורה בשקט,
            <br />
            אפשר להגיד בקול
          </h1>
          <p className="mx-auto mt-5 max-w-md text-[17px] leading-relaxed text-[var(--l-muted)]">
            דיווח אנונימי על ביטויי אי־שוויון חברתי — כדי שדפוסים חוזרים יקבלו
            שם, וארגונים יקבלו הזדמנות לתקן.
          </p>
        </div>

        {/* Sign-in card, encircled by the linked rings of people. */}
        <div className="relative mt-24 w-full">
          <LinkedRings className="absolute left-1/2 top-1/2 h-auto w-[200%] max-w-none -translate-x-1/2 -translate-y-1/2 sm:w-[132%]" />

          <div className="relative rounded-2xl bg-white p-6 shadow-[0_1px_2px_rgba(14,46,28,0.06)] ring-1 ring-[var(--l-ring)]">
            <div className="flex flex-col gap-3">
              <Link
                to={paths.register}
                className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[var(--l-primary)] text-[15px] font-semibold text-white transition-colors hover:bg-[var(--l-primary-hover)]"
              >
                הרשמה
              </Link>
              <Link
                to={paths.login}
                className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[var(--l-soft)] text-[15px] font-semibold text-[var(--l-ink)] transition-colors hover:bg-[var(--l-soft-hover)]"
              >
                יש לי כבר חשבון
              </Link>
            </div>

            <div className="my-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-[var(--l-ring)]" />
              <span className="text-xs font-medium text-[var(--l-muted)]">או</span>
              <span className="h-px flex-1 bg-[var(--l-ring)]" />
            </div>

            <button
              type="button"
              disabled={google.isPending}
              onClick={() => google.mutate()}
              className="inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-[var(--l-ring)] bg-white text-[15px] font-medium text-slate-700 transition-colors hover:bg-[var(--l-via)] disabled:opacity-60"
            >
              <GoogleMark />
              המשך עם Google
            </button>

            {google.error && (
              <p role="alert" className="mt-3 text-xs text-red-700">
                {google.error.message}
              </p>
            )}

            <p className="mt-5 text-xs leading-relaxed text-[var(--l-muted)]">
              הדיווחים אנונימיים. הזהות שלך לעולם אינה נשמרת לצד הדיווח.
            </p>
          </div>

          {/* A second, deliberately separate path: organisations register an
              account and their organisation together, and wait for approval. */}
          <div className="relative mt-4 rounded-2xl border border-dashed border-[var(--l-ring)] bg-white/70 p-5 backdrop-blur-sm">
            <p className="text-sm font-semibold text-[var(--l-ink)]">
              נרשמים בשם ארגון?
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--l-muted)]">
              רישום ארגון ומנהל.ת מערכת הוא תהליך נפרד, והוא טעון אישור.
            </p>
            <Link
              to={paths.orgRequest}
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--l-primary)] text-[15px] font-semibold text-[var(--l-primary)] transition-colors hover:bg-[var(--l-soft)]"
            >
              <Building2 size={17} aria-hidden="true" />
              לרישום ארגון
            </Link>
          </div>
        </div>

        <p className="mt-auto pt-20 text-xs text-[var(--l-muted)]">
          תנאי שימוש
          <span className="mx-2 opacity-50">·</span>
          מדיניות פרטיות
          <span className="mx-2 opacity-50">·</span>
          יצירת קשר
        </p>
      </div>
    </div>
  )
}
