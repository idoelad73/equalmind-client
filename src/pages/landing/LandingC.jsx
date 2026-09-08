import { GoogleMark } from '@/components/auth/GoogleMark'

const POINTS = [
  {
    label: 'אנונימיות',
    text: 'הדיווח נשמר ללא קשר לזהות המדווח. גם לנו אין דרך לשחזר אותה.',
  },
  {
    label: 'דפוס, לא אירוע',
    text: 'התראה יוצאת רק כשמצטברים דיווחים עצמאיים על אותו גורם — ולאחר בדיקה אנושית.',
  },
  {
    label: 'נתונים להחלטות',
    text: 'הנהלות מקבלות תמונה לפי מרחב, קטגוריה וזמן — בסיס להחלטות ארגוניות.',
  },
]

/**
 * Option C — מסך פיצול.
 * Statement on a deep brand ground beside a plain white auth panel.
 * The confident product shape: message and action, side by side.
 */
export function LandingC() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.15fr_1fr]">
      {/* Message side */}
      <section className="flex flex-col justify-between bg-brand-900 px-6 py-12 text-white sm:px-12 lg:px-16">
        <span className="text-lg font-extrabold tracking-tight">Equalmind</span>

        <div className="py-16">
          <p className="text-sm font-semibold tracking-widest text-brand-300">
            מרחב ציבורי שוויוני
          </p>
          <h1 className="mt-4 text-[clamp(2rem,5vw,3.25rem)] font-extrabold leading-[1.1] tracking-tight text-balance">
            מדיווח בודד
            <br />
            לדפוס מוכח
          </h1>
          <p className="mt-6 max-w-md text-[17px] font-light leading-relaxed text-brand-100">
            פלטפורמה לדיווח על ביטויי אי־שוויון חברתי במרחב העבודה, הקהילה
            והצריכה — ולהפיכת דיווחים בודדים לתמונה שאפשר לפעול לפיה.
          </p>

          <dl className="mt-12 flex flex-col gap-6 border-s-2 border-brand-700 ps-6">
            {POINTS.map((point) => (
              <div key={point.label}>
                <dt className="text-[15px] font-bold text-white">{point.label}</dt>
                <dd className="mt-1 max-w-sm text-[15px] leading-relaxed text-brand-100/80">
                  {point.text}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <p className="text-xs text-brand-300/70">
          תנאי שימוש
          <span className="mx-2">·</span>
          מדיניות פרטיות
        </p>
      </section>

      {/* Action side */}
      <section className="flex items-center justify-center bg-white px-6 py-16 sm:px-12">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            כניסה למערכת
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
            ההרשמה ללא עלות ולוקחת פחות מדקה.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <button className="h-12 rounded-lg bg-brand-700 text-[15px] font-semibold text-white transition-colors hover:bg-brand-600">
              יצירת חשבון חדש
            </button>
            <button className="h-12 rounded-lg border border-slate-300 text-[15px] font-semibold text-slate-800 transition-colors hover:border-slate-400 hover:bg-slate-50">
              התחברות
            </button>
          </div>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-medium text-slate-400">או</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <button className="inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-lg border border-slate-300 bg-white text-[15px] font-medium text-slate-700 transition-colors hover:bg-slate-50">
            <GoogleMark />
            המשך עם Google
          </button>

          <p className="mt-8 text-xs leading-relaxed text-slate-500">
            בהרשמה אתם מאשרים את תנאי השימוש ומדיניות הפרטיות. הדיווחים
            במערכת אנונימיים.
          </p>
        </div>
      </section>
    </div>
  )
}
