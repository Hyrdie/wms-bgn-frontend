import type { InputHTMLAttributes } from 'react'

import { clsx } from '../../lib/utils'

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx('w-full rounded-md border border-slate-300 px-3 py-2 text-sm', props.className)}
    />
  )
}
