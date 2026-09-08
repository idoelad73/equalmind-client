import { GoogleMark } from '@/components/auth/GoogleMark'

/**
 * Option A — מניפסט.
 * Typographic statement page: oversized display type, hairline rules,
 * understated controls. The words are the design.
 */
export function LandingA() {
  return (
    <div className="min-h-screen bg-[#FBFAF7] text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-10 sm:px-10">
        <header className="flex items-baseline justify-between border-b border-slate-900 pb-4">
          <span className="text-lg font-extrabold tracking-tight">Equalmind</span>
          <span className="text-xs font-medium tracking-widest text-slate-500">
            מרחב ציבורי שוויוני
          </span>
        </header>

        <main className="flex flex-1 flex-col justify-center py-16">
          <h1 className="text-[clamp(2.5rem,8vw,4.5rem)] font-extrabold leading-[1.05] tracking-tight text-balance">
            אי־שוויון מתחיל
            <br />
            בשתיקה.
          </h1>

          <p className="mt-8 max-w-xl text-xl font-light leading-relaxed text-slate-700">
            Equalmind היא פלטפורמה לדיווח על ביטויי אי־שוויון חברתי במרחב
            הציבורי — במקום העבודה, בקהילה ובמרחב הצריכה.
          </p>

          <div className="mt-12 flex flex-col gap-px bg-slate-300">
            {[
              {
                title: 'הדיווח שלך אנונימי',
                body: 'הזהות שלך אינה נשמרת לצד הדיווח. אין דרך לקשר בין דיווח לבין מי שכתב אותו.',
              },
              {
                title: 'התראה נשלחת רק כשיש דפוס',
                body: 'דיווח בודד אינו מפעיל דבר. רק דיווחים חוזרים על אותו גורם, ורק לאחר בדיקה אנושית.',
              },
              {
                title: 'לארגונים יש אחריות',
                body: 'מקום העבודה הפך למרחב חברתי מרכזי. לנתונים יש כוח להפוך אחריות לשינוי.',
              },
            ].map((item) => (
              <section key={item.title} className="bg-[#FBFAF7] py-5">
                <h2 className="text-base font-bold">{item.title}</h2>
                <p className="mt-1 max-w-xl text-[15px] leading-relaxed text-slate-600">
                  {item.body}
                </p>
              </section>
            ))}
          </div>
        </main>

        <footer className="border-t border-slate-900 pt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button className="h-12 bg-slate-950 px-8 text-[15px] font-semibold text-white transition-colors hover:bg-slate-800">
              הרשמה
            </button>
            <button className="h-12 border border-slate-950 px-8 text-[15px] font-semibold transition-colors hover:bg-slate-950 hover:text-white">
              התחברות
            </button>
            <button className="inline-flex h-12 items-center justify-center gap-2.5 border border-slate-300 bg-white px-6 text-[15px] font-medium transition-colors hover:border-slate-950">
              <GoogleMark />
              המשך עם Google
            </button>
          </div>
          <p className="mt-6 text-xs text-slate-500">
            ההרשמה ללא עלות. הדיווחים אנונימיים.
            <span className="mx-2 text-slate-300">·</span>
            תנאי שימוש
            <span className="mx-2 text-slate-300">·</span>
            פרטיות
          </p>
        </footer>
      </div>
    </div>
  )
}
