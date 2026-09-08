import { GoogleMark } from '@/components/auth/GoogleMark'
import { CommunityBackdrop } from '@/components/decor/CommunityBackdrop'
import { PALETTES } from './landingPalettes'

const DOMAINS = ['מרחב עבודה', 'מרחב קהילה', 'מרחב צריכה']

export function LandingPage({ palette = 'petrol' }) {
  const { vars } = PALETTES[palette] ?? PALETTES.petrol

  return (
    <div
      style={vars}
      className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[var(--l-from)] via-[var(--l-via)] to-white"
    >
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

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {DOMAINS.map((domain) => (
            <span
              key={domain}
              className="rounded-full bg-white/80 px-4 py-1.5 text-[13px] font-medium text-[var(--l-primary)] ring-1 ring-[var(--l-ring)] backdrop-blur-sm"
            >
              {domain}
            </span>
          ))}
        </div>

        <div className="mt-12 w-full rounded-2xl bg-white/90 p-6 shadow-sm ring-1 ring-[var(--l-ring)] backdrop-blur-sm">
          <div className="flex flex-col gap-3">
            <button className="h-12 w-full rounded-xl bg-[var(--l-primary)] text-[15px] font-semibold text-white transition-colors hover:bg-[var(--l-primary-hover)]">
              הרשמה
            </button>
            <button className="h-12 w-full rounded-xl bg-[var(--l-soft)] text-[15px] font-semibold text-[var(--l-ink)] transition-colors hover:bg-[var(--l-soft-hover)]">
              יש לי כבר חשבון
            </button>
          </div>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-[var(--l-ring)]" />
            <span className="text-xs font-medium text-[var(--l-muted)]">או</span>
            <span className="h-px flex-1 bg-[var(--l-ring)]" />
          </div>

          <button className="inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-[var(--l-ring)] bg-white text-[15px] font-medium text-slate-700 transition-colors hover:bg-[var(--l-via)]">
            <GoogleMark />
            המשך עם Google
          </button>

          <p className="mt-5 text-xs leading-relaxed text-[var(--l-muted)]">
            הדיווחים אנונימיים. הזהות שלך לעולם אינה נשמרת לצד הדיווח.
          </p>
        </div>

        <p className="mt-auto pt-10 text-xs text-[var(--l-muted)]">
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
