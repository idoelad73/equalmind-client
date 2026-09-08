import { Link } from 'react-router-dom'

const OPTIONS = [
  { to: '/landing/a', name: 'א — מניפסט', note: 'טיפוגרפיה גדולה, ניגודיות גבוהה, אמירה' },
  { to: '/landing/b', name: 'ב — קהילה', note: 'עמודה מרוכזת, גוונים רכים, תחושת אפליקציה חברתית' },
  { to: '/landing/c', name: 'ג — מסך פיצול', note: 'מסר מול פאנל כניסה, מראה מוצרי' },
]

/** Chooser page for reviewing the three landing directions side by side. */
export function LandingIndex() {
  return (
    <div className="mx-auto max-w-lg px-6 py-20">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        שלוש אפשרויות לעמוד הנחיתה
      </h1>
      <ul className="mt-8 flex flex-col gap-3">
        {OPTIONS.map((option) => (
          <li key={option.to}>
            <Link
              to={option.to}
              className="block rounded-lg border border-slate-200 p-4 transition-colors hover:border-brand-500 hover:bg-brand-50"
            >
              <span className="font-semibold text-slate-900">{option.name}</span>
              <span className="mt-1 block text-sm text-slate-600">{option.note}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
