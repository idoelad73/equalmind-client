import { cn } from '@/lib/utils'

/**
 * One labelled input. Shares the auth form's look so the organisation form
 * does not read as a different product.
 */
export function Field({
  label,
  name,
  type = 'text',
  required = false,
  value,
  error,
  hint,
  placeholder,
  autoComplete,
  inputMode,
  dir,
  readOnly = false,
  as = 'input',
  rows = 4,
  onChange,
}) {
  const id = `field-${name}`
  const Tag = as
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined

  return (
    <label htmlFor={id} className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-[var(--l-ink)]">
        {label}{' '}
        <span className="font-normal text-[var(--l-muted)]">
          ({required ? 'חובה' : 'אופציונלי'})
        </span>
      </span>

      <Tag
        id={id}
        name={name}
        {...(as === 'input' ? { type } : { rows })}
        readOnly={readOnly}
        dir={dir}
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={cn(
          'rounded-xl border bg-white px-3 text-[15px] outline-none transition-colors',
          as === 'input' ? 'h-12' : 'py-2.5 leading-relaxed',
          error
            ? 'border-red-400 focus:border-red-500'
            : 'border-[var(--l-ring)] focus:border-[var(--l-primary)]',
        )}
      />

      {error ? (
        <span id={`${id}-error`} className="text-xs text-red-600">
          {error}
        </span>
      ) : hint ? (
        <span id={`${id}-hint`} className="text-xs text-[var(--l-muted)]">
          {hint}
        </span>
      ) : null}
    </label>
  )
}
