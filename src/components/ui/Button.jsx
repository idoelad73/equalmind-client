import { cn } from '@/lib/utils'

const VARIANTS = {
  primary: 'bg-brand-700 text-white hover:bg-brand-600',
  secondary: 'bg-brand-50 text-brand-900 hover:bg-brand-100',
  ghost: 'bg-transparent text-brand-700 hover:bg-brand-50',
}

const SIZES = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium',
        'transition-colors disabled:pointer-events-none disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  )
}
