import { Flag, Megaphone, MousePointerClick, ShieldCheck, Sparkles } from 'lucide-react'
import { CommunityBackdrop } from '@/components/decor/CommunityBackdrop'

const HOW_IT_WORKS = [
  {
    icon: Megaphone,
    term: 'דיווח',
    body: 'בכל פעם שתיתקל/י בהתנהגות שבעיניך חיובית (או פוגענית ומדירה) כלפיך או כלפי מישהו/י בסביבה, תוכל/י לדווח עליה ועל האדם או הארגון שאחראי עליה.',
  },
  {
    icon: Sparkles,
    term: 'מה זה דיווח?',
    body: "דיווח הוא פעולת ההצבעה על התנהגות. הדיווחים הם ה'ווים' שעליהם א.נשים נעשים מודעים להתנהגויות שלהם — כדי לחזק את החיוביות ולהחליף את הפוגעניות בטובות יותר.",
  },
  {
    icon: MousePointerClick,
    term: '2-3 קליקים וזהו',
    body: 'המערכת תציע לך סוגים שונים של התנהגויות אופייניות לסביבות שונות, ובמספר צעדים קצרים ופשוטים תוכל/י לדווח.',
  },
  {
    icon: Flag,
    term: 'GREEN FLAGS',
    body: "אנחנו נדאג להרים 'דגלים ירוקים' ולתת משוב לא.נשים ולארגונים שיצברו דיווחים, וגם נציע להם דרכים והתנהגויות להתפתח ולהיות מיטיבים ומיטיבות יותר.",
  },
]

const REASSURANCE = [
  {
    title: 'הדיווחים אנונימיים כלפי הארגון',
    body: 'הדיווחים שלך יצטרפו לדיווחים של אחרות ואחרים ביחס לאדם מסוים. רק אם נזהה דפוס התנהגות קבוע ומתמשך אותו אדם יקבל FLAG — כך שבכל מקרה הארגון לא ידע מי תרמ/ה דיווח.',
  },
  {
    title: 'הדגלים האישיים',
    body: "רק מי שדיווחו עליו מקבל את הדגלים שלו. לא הבוס/ית שלו/ה, לא מנהל/ת אחר/ת ולא כל סמכות אחרת תדע מזה.",
  },
]

export function AboutPage() {
  return (
    <div className="relative -mx-4 -my-8 overflow-hidden bg-white px-4 py-12 sm:px-8">
      <CommunityBackdrop />

      <article className="relative mx-auto flex max-w-2xl flex-col gap-14">
        {/* ---- what it is ---- */}
        <header className="text-center">
          <h1 className="text-[clamp(1.75rem,5vw,2.5rem)] font-extrabold tracking-tight text-balance text-[var(--l-ink)]">
            מה זה <bdi>Equalmind</bdi>?
          </h1>

          <p className="mt-8 text-[19px] font-medium leading-relaxed text-[var(--l-ink)]">
            איקואלמיינד זו קהילה שמסייעת לעצב יחסים ומרחבים מיטיבים.
          </p>
          <p className="mt-5 text-[16px] leading-relaxed text-[var(--l-muted)]">
            בחלק מהקהילה, תוכל/י לעזור לקדם א.נשים ומקומות נעימים, שוויוניים
            ומכבדים — בעבודה שלך, ובכל מרחב אחר שאת/ה מסתובב/ת בו (במסעדה,
            בקניון, ברחוב ואפילו בחדר הכושר או בחוג שאת/ה משתתפ/ת בו). כי לכולנו
            נעים יותר לעבוד, להסתובב ולתקשר עם אנשים בסביבות שבהן מרגיש לנו נוח,
            מכבד ומתחשב.
          </p>
          <p className="mt-5 text-[16px] leading-relaxed text-[var(--l-muted)]">
            עם איקואלמיינד{' '}
            <strong className="font-semibold text-[var(--l-ink)]">
              נחזק התנהגויות חיוביות
            </strong>
            , מכילות ושוויוניות של א.נשים ושל מקומות שאת/ה חלק מהם, וגם נעזור{' '}
            <strong className="font-semibold text-[var(--l-ink)]">
              להחליף התנהגויות פוגעניות ומדירות
            </strong>
            .
          </p>
        </header>

        {/* ---- how it works ---- */}
        <section>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--l-ink)]">
            איך זה עובד?
          </h2>

          <dl className="mt-6 flex flex-col gap-3">
            {HOW_IT_WORKS.map(({ icon: Icon, term, body }) => (
              <div
                key={term}
                className="flex gap-4 rounded-xl bg-white/90 p-4 shadow-[0_1px_2px_rgba(14,46,28,0.05)] ring-1 ring-[var(--l-ring)] backdrop-blur-sm"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--l-soft)] text-[var(--l-primary)]">
                  <Icon size={17} aria-hidden="true" />
                </span>
                <div>
                  <dt className="text-[15px] font-bold text-[var(--l-primary)]">
                    {term}
                  </dt>
                  <dd className="mt-1 text-[15px] leading-relaxed text-[var(--l-muted)]">
                    {body}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </section>

        {/* ---- am I an informer? ---- */}
        <section>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--l-ink)]">
            זה בעצם אומר שאני ׳מלשן/ית׳?
          </h2>

          <div className="mt-6 rounded-2xl bg-[var(--l-soft)] p-6">
            <p className="flex items-center gap-2 text-lg font-bold text-[var(--l-ink)]">
              <ShieldCheck
                size={20}
                className="text-[var(--l-primary)]"
                aria-hidden="true"
              />
              אין לך מה לדאוג!
            </p>

            <ol className="mt-5 flex flex-col gap-5">
              {REASSURANCE.map((item, index) => (
                <li key={item.title} className="flex gap-3">
                  <span className="text-sm font-bold text-[var(--l-primary)]">
                    {index + 1}.
                  </span>
                  <div>
                    <h3 className="text-[15px] font-bold text-[var(--l-ink)]">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-[15px] leading-relaxed text-[var(--l-ink)]/75">
                      {item.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <p className="mt-6 border-t border-[var(--l-primary)]/15 pt-5 text-[15px] leading-relaxed text-[var(--l-ink)]/80">
              <strong className="font-bold text-[var(--l-ink)]">למה?</strong> כי
              הכוונה של איקואלמיינד היא לחזק התנהגויות חיוביות ולעזור לא.נשים
              להשתפר כשצריך — לא ׳להעניש׳ אותם.
            </p>
          </div>
        </section>
      </article>
    </div>
  )
}
