import { clsx } from '../../lib/utils'

export function Badge({ label, variant = 'default' }: { label: string; variant?: 'default' | 'success' | 'warning' }) {
  return (
    <span
      className={clsx('rounded-full px-2 py-1 text-xs font-medium', {
        'bg-slate-100 text-slate-700': variant === 'default',
        'bg-emerald-100 text-emerald-700': variant === 'success',
        'bg-amber-100 text-amber-700': variant === 'warning',
      })}
    >
      {label}
    </span>
  )
}
