import { GoogleMark } from '@/components/auth/GoogleMark'

const DOMAINS = ['מרחב עבודה', 'מרחב קהילה', 'מרחב צריכה']

/**
 * Option B — קהילה.
 * Warm, centred onboarding column. Soft brand ground, generous spacing,
 * stacked full-width controls: the shape social apps open with.
 */
export function LandingB() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-white">
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center px-6 py-14 text-center">
        <span className="text-xl font-extrabold tracking-tight text-brand-700">
          Equalmind
        </span>

        <div className="mt-14">
          <p className="text-sm font-semibold tracking-wide text-brand-600">
            כי המרחב הציבורי שייך לכולם
          </p>
          <h1 className="mt-3 text-[clamp(2rem,7vw,2.75rem)] font-extrabold leading-tight tracking-tight text-slate-900 text-balance">
            מה שקורה בשקט,
            <br />
            אפשר להגיד בקול
          </h1>
          <p className="mx-auto mt-5 max-w-md text-[17px] leading-relaxed text-slate-600">
            דיווח אנונימי על ביטויי אי־שוויון חברתי — כדי שדפוסים חוזרים יקבלו
            שם, וארגונים יקבלו הזדמנות לתקן.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {DOMAINS.map((domain) => (
            <span
              key={domain}
              className="rounded-full bg-white px-4 py-1.5 text-[13px] font-medium text-brand-700 ring-1 ring-brand-100"
            >
              {domain}
            </span>
          ))}
        </div>

        <div className="mt-12 w-full rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
          <div className="flex flex-col gap-3">
            <button className="h-12 w-full rounded-xl bg-brand-700 text-[15px] font-semibold text-white transition-colors hover:bg-brand-600">
              הרשמה חינם
            </button>
            <button className="h-12 w-full rounded-xl bg-brand-50 text-[15px] font-semibold text-brand-800 transition-colors hover:bg-brand-100">
              יש לי כבר חשבון
            </button>
          </div>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-medium text-slate-400">או</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <button className="inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-slate-300 bg-white text-[15px] font-medium text-slate-700 transition-colors hover:bg-slate-50">
            <GoogleMark />
            המשך עם Google
          </button>

          <p className="mt-5 text-xs leading-relaxed text-slate-500">
            הדיווחים אנונימיים. הזהות שלך לעולם אינה נשמרת לצד הדיווח.
          </p>
        </div>

        <p className="mt-auto pt-10 text-xs text-slate-400">
          תנאי שימוש
          <span className="mx-2">·</span>
          מדיניות פרטיות
          <span className="mx-2">·</span>
          יצירת קשר
        </p>
      </div>
    </div>
  )
}
