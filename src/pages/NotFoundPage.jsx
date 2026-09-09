import { Link } from 'react-router-dom'
import { paths } from '@/routes/paths'

export function NotFoundPage() {
  return (
    <div className="mx-auto mt-24 max-w-md text-center">
      <p className="text-sm font-medium text-slate-500">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">הדף לא נמצא</h1>
      <Link to={paths.landing} className="mt-6 inline-block text-sm text-brand-700 underline">
        חזרה לדף הבית
      </Link>
    </div>
  )
}
