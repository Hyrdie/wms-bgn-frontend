import type { PropsWithChildren } from 'react'

import { clsx } from '../../lib/utils'

export function Card({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <div className={clsx('rounded-xl border border-slate-200 bg-white p-4 shadow-sm', className)}>{children}</div>
}
