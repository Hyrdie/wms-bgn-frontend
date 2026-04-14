export type ItemStatus = 'warehouse' | 'staging' | 'implementation'

export const ITEM_STATUS_OPTIONS: { value: ItemStatus; label: string }[] = [
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'staging', label: 'Staging' },
  { value: 'implementation', label: 'Implementation' },
]

export function itemStatusLabel(s: string | null | undefined) {
  const v = (s || 'warehouse').toLowerCase()
  return ITEM_STATUS_OPTIONS.find((o) => o.value === v)?.label ?? v
}

/** Tailwind classes for item-status pills (warehouse → staging → implementation). */
export function itemStatusPillClass(s: string | null | undefined) {
  const v = (s || 'warehouse').toLowerCase()
  const base = 'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset'
  if (v === 'implementation') return `${base} bg-indigo-50 text-indigo-900 ring-indigo-200/90`
  if (v === 'staging') return `${base} bg-amber-50 text-amber-900 ring-amber-200/90`
  if (v === 'warehouse') return `${base} bg-teal-50 text-teal-900 ring-teal-200/90`
  return `${base} bg-slate-100 text-slate-700 ring-slate-200/80`
}

export function scanStatusLabel(s: string | null | undefined) {
  const v = (s || '').trim().toLowerCase()
  if (v === 'scanned') return 'Scanned'
  if (v === 'pending') return 'Pending'
  if (!s?.trim()) return '—'
  return s.trim()
}

/** Tailwind classes for scan status (serial captured or not). */
export function scanStatusPillClass(s: string | null | undefined) {
  const v = (s || '').trim().toLowerCase()
  const base = 'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset'
  if (v === 'scanned') return `${base} bg-emerald-50 text-emerald-900 ring-emerald-200/90`
  if (v === 'pending') return `${base} bg-orange-50 text-orange-900 ring-orange-200/90`
  if (!v) return `${base} bg-slate-100 text-slate-500 ring-slate-200/80`
  return `${base} bg-violet-50 text-violet-900 ring-violet-200/80`
}
