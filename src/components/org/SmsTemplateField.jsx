import { AlertTriangle, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { counterFor, MAX_TEMPLATE_LENGTH } from '@/lib/smsText'

/**
 * The invitation text, with a counter that reports what it will cost.
 *
 * The counter leads with segments, not characters. Characters are not what
 * anyone is billed for: a Hebrew message becomes a second segment at 71
 * characters, and at roster scale that doubles the bill without anything
 * visibly changing. So the number that gets the emphasis is the one that
 * multiplies.
 *
 * Shared by the onboarding form and the notify dialog, so the figure an
 * admin saw when they wrote the message is the same one they see when they
 * send it.
 */
export function SmsTemplateField({
  value,
  onChange,
  disabled = false,
  error,
  organizationName = 'הארגון',
  label = 'הודעת ההזמנה',
  hint,
}) {
  const counter = counterFor(value)

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label
          htmlFor="sms-template"
          className="flex items-center gap-1.5 text-sm font-medium text-slate-900"
        >
          <MessageSquare size={14} className="text-slate-400" aria-hidden="true" />
          {label}
        </label>

        <span
          className={cn(
            'font-mono text-xs tabular-nums',
            counter.overLimit
              ? 'font-semibold text-red-700'
              : counter.nearBoundary
                ? 'text-amber-700'
                : 'text-slate-500',
          )}
          aria-live="polite"
        >
          {counter.used}/{MAX_TEMPLATE_LENGTH} · {counter.segments}{' '}
          {counter.segments === 1 ? 'מקטע' : 'מקטעים'}
        </span>
      </div>

      {hint && <p className="text-xs leading-relaxed text-slate-500">{hint}</p>}

      <textarea
        id="sms-template"
        rows={4}
        dir="rtl"
        value={value ?? ''}
        disabled={disabled}
        maxLength={MAX_TEMPLATE_LENGTH}
        onChange={(event) => onChange(event.target.value)}
        placeholder={`{org} הצטרף ל-Equalmind. להרשמה: {url}`}
        aria-invalid={Boolean(error) || counter.overLimit}
        aria-describedby="sms-template-meta"
        className={cn(
          'w-full resize-y rounded-xl border bg-white px-4 py-3 text-[15px] leading-relaxed text-slate-900 outline-none transition-colors placeholder:text-slate-400',
          counter.overLimit || error
            ? 'border-red-400'
            : 'border-slate-300 focus:border-[var(--l-primary)]',
        )}
      />

      <div id="sms-template-meta" className="flex flex-col gap-1">
        <p className="text-xs leading-relaxed text-slate-500">
          <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px]">
            {'{org}'}
          </code>{' '}
          יוחלף ב״<bdi>{organizationName}</bdi>״,{' '}
          <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px]">
            {'{url}'}
          </code>{' '}
          בקישור ההרשמה. ריק = הודעת ברירת המחדל.
        </p>

        {counter.unicode && counter.segments > 1 && (
          <p className="flex items-start gap-1.5 text-xs leading-relaxed text-amber-800">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
            הודעה בעברית נספרת ב-70 תווים למקטע. הודעה זו תישלח כ-
            {counter.segments} מקטעים — כלומר עלות כפולה לכל נמען/ת.
          </p>
        )}

        {error && (
          <p role="alert" className="text-xs text-red-700">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
