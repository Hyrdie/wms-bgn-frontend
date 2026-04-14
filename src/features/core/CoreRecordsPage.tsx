import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'

import { apiDelete, apiGet, apiPost, apiPut } from '../../lib/api/client'
import { ngrokSkipBrowserWarningHeaders } from '../../lib/api/ngrok'
import { endpoints } from '../../lib/api/endpoints'
import { apiPublicOrigin } from '../../lib/api/origin'
import { useEnvironmentStore } from '../../store/environmentStore'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'

import {
  ITEM_STATUS_OPTIONS,
  type ItemStatus,
  itemStatusLabel,
  itemStatusPillClass,
  scanStatusLabel,
  scanStatusPillClass,
} from './statusPills'

type AssetRecord = {
  id: number
  bgn_id: string
  kitchen_id: number
  bundle_id: number
  item_type: string
  items_id: string | null
  mac_address: string | null
  ip_address?: string | null
  item_status?: string | null
  ip_range?: string | null
  ssid_24?: string | null
  password_24?: string | null
  ssid_5?: string | null
  password_5?: string | null
  id_dashboard?: string | null
  scan_status: string
  environment: string
  sppg_id: string | null
  nama_sppg: string | null
  photos?: Record<string, string | null> | null
}

type RecordForm = {
  bgn_id: string
  kitchen_id: string
  item_type: string
  items_id: string
  mac_address: string
  ip_address: string
  item_status: ItemStatus
  ip_range: string
  ssid_24: string
  password_24: string
  ssid_5: string
  password_5: string
  id_dashboard: string
}

const ITEM_TYPES = ['CCTV', 'Digital signage + bracket', 'Router', 'Switch', 'PVR Kitchen', 'Laptop']

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const

const PHOTO_PHASES: { key: ItemStatus; label: string }[] = [
  { key: 'warehouse', label: 'Warehouse' },
  { key: 'staging', label: 'Staging' },
  { key: 'implementation', label: 'Implementation' },
]

function displayVal(v: string | null | undefined) {
  const t = v?.trim()
  return t ? t : '—'
}

type AssetRecordPage = {
  total: number
  items: AssetRecord[]
}

function emptyForm(): RecordForm {
  return {
    bgn_id: '',
    kitchen_id: '',
    item_type: 'CCTV',
    items_id: '',
    mac_address: '',
    ip_address: '',
    item_status: 'warehouse',
    ip_range: '',
    ssid_24: '',
    password_24: '',
    ssid_5: '',
    password_5: '',
    id_dashboard: '',
  }
}

function recordToForm(r: AssetRecord): RecordForm {
  const raw = (r.item_status || 'warehouse').toLowerCase()
  const item_status: ItemStatus =
    raw === 'staging' || raw === 'implementation' || raw === 'warehouse' ? (raw as ItemStatus) : 'warehouse'
  return {
    bgn_id: r.bgn_id,
    kitchen_id: String(r.kitchen_id),
    item_type: r.item_type,
    items_id: r.items_id ?? '',
    mac_address: r.mac_address ?? '',
    ip_address: r.ip_address ?? '',
    item_status,
    ip_range: r.ip_range ?? '',
    ssid_24: r.ssid_24 ?? '',
    password_24: r.password_24 ?? '',
    ssid_5: r.ssid_5 ?? '',
    password_5: r.password_5 ?? '',
    id_dashboard: r.id_dashboard ?? '',
  }
}

function DetailIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  )
}

function RecordFormFields({
  form,
  onChange,
}: {
  form: RecordForm
  onChange: (next: RecordForm) => void
}) {
  const set = (patch: Partial<RecordForm>) => onChange({ ...form, ...patch })
  const isRouter = form.item_type === 'Router'
  const isSignage = form.item_type === 'Digital signage + bracket'
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label className="space-y-1 sm:col-span-2">
        <span className="text-xs font-medium text-slate-600">BGN ID</span>
        <Input placeholder="BGN ID" value={form.bgn_id} onChange={(e) => set({ bgn_id: e.target.value })} />
      </label>
      <label className="space-y-1">
        <span className="text-xs font-medium text-slate-600">Kitchen ID</span>
        <Input
          placeholder="Kitchen ID"
          type="number"
          value={form.kitchen_id}
          onChange={(e) => set({ kitchen_id: e.target.value })}
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs font-medium text-slate-600">Item type</span>
        <select
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={form.item_type}
          onChange={(e) => set({ item_type: e.target.value })}
        >
          {ITEM_TYPES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1">
        <span className="text-xs font-medium text-slate-600">Item status</span>
        <select
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={form.item_status}
          onChange={(e) => set({ item_status: e.target.value as ItemStatus })}
        >
          {ITEM_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1 sm:col-span-2">
        <span className="text-xs font-medium text-slate-600">Serial number</span>
        <Input
          placeholder="Serial (empty = warehouse default; filled saves may move to staging)"
          value={form.items_id}
          onChange={(e) => set({ items_id: e.target.value })}
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs font-medium text-slate-600">MAC address</span>
        <Input
          placeholder="MAC address"
          value={form.mac_address}
          onChange={(e) => set({ mac_address: e.target.value })}
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs font-medium text-slate-600">IP address</span>
        <Input
          placeholder="IP address"
          value={form.ip_address}
          onChange={(e) => set({ ip_address: e.target.value })}
        />
      </label>
      {isSignage ? (
        <label className="space-y-1 sm:col-span-2">
          <span className="text-xs font-medium text-slate-600">ID dashboard</span>
          <Input
            value={form.id_dashboard}
            onChange={(e) => set({ id_dashboard: e.target.value })}
          />
        </label>
      ) : null}
      {isRouter ? (
        <>
          <label className="space-y-1 sm:col-span-2">
            <span className="text-xs font-medium text-slate-600">IP range</span>
            <Input value={form.ip_range} onChange={(e) => set({ ip_range: e.target.value })} />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-slate-600">SSID 2.4G</span>
            <Input value={form.ssid_24} onChange={(e) => set({ ssid_24: e.target.value })} />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-slate-600">Password 2.4G</span>
            <Input
              type="password"
              value={form.password_24}
              onChange={(e) => set({ password_24: e.target.value })}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-slate-600">SSID 5G</span>
            <Input value={form.ssid_5} onChange={(e) => set({ ssid_5: e.target.value })} />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-slate-600">Password 5G</span>
            <Input
              type="password"
              value={form.password_5}
              onChange={(e) => set({ password_5: e.target.value })}
            />
          </label>
        </>
      ) : null}
    </div>
  )
}

export function CoreRecordsPage() {
  const environment = useEnvironmentStore((state) => state.environment)
  const queryClient = useQueryClient()
  const [filterBgn, setFilterBgn] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(20)
  const [createForm, setCreateForm] = useState<RecordForm>(emptyForm)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<RecordForm>(emptyForm)
  const [detailRecord, setDetailRecord] = useState<AssetRecord | null>(null)

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ environment })
    params.set('page', String(page))
    params.set('page_size', String(pageSize))
    if (filterBgn.trim()) params.set('bgn_id', filterBgn.trim())
    return params.toString()
  }, [environment, filterBgn, page, pageSize])

  const records = useQuery({
    queryKey: ['core-records', queryString],
    queryFn: () => apiGet<AssetRecordPage>(`${endpoints.core.records}?${queryString}`),
  })

  const total = records.data?.total ?? 0
  const items = records.data?.items ?? []
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  useEffect(() => {
    setPage(1)
  }, [environment, filterBgn])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const closeEditModal = () => {
    setEditModalOpen(false)
    setEditingId(null)
    setEditForm(emptyForm())
  }

  const createRecord = useMutation({
    mutationFn: async () => {
      const payload = {
        bgn_id: createForm.bgn_id,
        kitchen_id: Number(createForm.kitchen_id),
        item_type: createForm.item_type,
        items_id: createForm.items_id || null,
        mac_address: createForm.mac_address || null,
        ip_address: createForm.ip_address || null,
        item_status: createForm.item_status,
        ip_range: createForm.ip_range || null,
        ssid_24: createForm.ssid_24 || null,
        password_24: createForm.password_24 || null,
        ssid_5: createForm.ssid_5 || null,
        password_5: createForm.password_5 || null,
        id_dashboard: createForm.id_dashboard || null,
        environment,
      }
      return apiPost(endpoints.core.records, payload)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['core-records'] })
      setCreateForm(emptyForm())
    },
  })

  const updateRecord = useMutation({
    mutationFn: async () => {
      if (editingId == null) throw new Error('No record selected')
      const payload = {
        bgn_id: editForm.bgn_id,
        kitchen_id: Number(editForm.kitchen_id),
        item_type: editForm.item_type,
        items_id: editForm.items_id || null,
        mac_address: editForm.mac_address || null,
        ip_address: editForm.ip_address || null,
        item_status: editForm.item_status,
        ip_range: editForm.ip_range || null,
        ssid_24: editForm.ssid_24 || null,
        password_24: editForm.password_24 || null,
        ssid_5: editForm.ssid_5 || null,
        password_5: editForm.password_5 || null,
        id_dashboard: editForm.id_dashboard || null,
        environment,
      }
      return apiPut(`${endpoints.core.records}/${editingId}`, payload)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['core-records'] })
      closeEditModal()
    },
  })

  const remove = useMutation({
    mutationFn: (id: number) => apiDelete(`${endpoints.core.records}/${id}`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['core-records'] }),
  })

  const exportCsv = async () => {
    const token = localStorage.getItem('wms_access_token')
    const params = new URLSearchParams({ environment, format: 'csv' })
    if (filterBgn.trim()) params.set('bgn_id', filterBgn.trim())
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}${endpoints.core.export}?${params.toString()}`,
      {
        headers: {
          ...ngrokSkipBrowserWarningHeaders(),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    )
    if (!response.ok) return
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'core_export.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const openEdit = (record: AssetRecord) => {
    setEditingId(record.id)
    setEditForm(recordToForm(record))
    setEditModalOpen(true)
  }

  const detailOrigin = apiPublicOrigin()

  return (
    <Card className="space-y-4">
      <h2 className="text-lg font-semibold">Core Records</h2>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        <Input placeholder="Search BGN ID" value={filterBgn} onChange={(e) => setFilterBgn(e.target.value)} />
        <Button onClick={() => void records.refetch()}>Search</Button>
        <Button className="bg-emerald-600 hover:bg-emerald-500" onClick={exportCsv}>
          Export CSV
        </Button>
      </div>

      <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
        <h3 className="text-sm font-medium text-slate-800">Create record</h3>
        <RecordFormFields form={createForm} onChange={setCreateForm} />
        <Button onClick={() => createRecord.mutate()} disabled={createRecord.isPending}>
          {createRecord.isPending ? 'Creating…' : 'Create Record'}
        </Button>
      </div>

      {records.isLoading ? (
        <p className="text-sm text-slate-500">Loading records…</p>
      ) : records.isError ? (
        <p className="text-sm text-rose-600">{(records.error as Error).message}</p>
      ) : total === 0 ? (
        <p className="text-sm text-slate-500">No records for this item status / filter.</p>
      ) : (
        <div className={`overflow-hidden rounded-lg border border-slate-200 shadow-sm ${records.isFetching ? 'opacity-75' : ''}`}>
          <div className="max-h-[min(70vh,720px)] overflow-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  <th scope="col" className="whitespace-nowrap px-3 py-3">
                    ID
                  </th>
                  <th scope="col" className="whitespace-nowrap px-3 py-3">
                    BGN ID
                  </th>
                  <th scope="col" className="whitespace-nowrap px-3 py-3">
                    Item type
                  </th>
                  <th scope="col" className="min-w-[200px] px-3 py-3">
                    SPPG / Kitchen
                  </th>
                  <th scope="col" className="whitespace-nowrap px-3 py-3">
                    Item status
                  </th>
                  <th scope="col" className="whitespace-nowrap px-3 py-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {items.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-slate-600">{record.id}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-medium text-slate-900">{record.bgn_id}</td>
                    <td className="px-3 py-2.5 text-slate-700">{record.item_type}</td>
                    <td className="max-w-[260px] px-3 py-2.5 text-slate-700">
                      <div className="font-medium text-slate-900">{record.nama_sppg ?? record.sppg_id ?? '—'}</div>
                      <div className="text-xs text-slate-500">
                        {record.nama_sppg && record.sppg_id ? (
                          <span className="font-mono">{record.sppg_id}</span>
                        ) : (
                          <span className="font-mono">Kitchen #{record.kitchen_id}</span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <span className={itemStatusPillClass(record.item_status)}>{itemStatusLabel(record.item_status)}</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">
                      <div className="inline-flex flex-wrap justify-end gap-1">
                        <button
                          type="button"
                          title="View details"
                          aria-label="View details"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          onClick={() => setDetailRecord(record)}
                        >
                          <DetailIcon />
                        </button>
                        <button
                          type="button"
                          title="Edit"
                          aria-label="Edit"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-indigo-600 text-white hover:bg-indigo-500"
                          onClick={() => openEdit(record)}
                        >
                          <PencilIcon />
                        </button>
                        <button
                          type="button"
                          title="Delete"
                          aria-label="Delete"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-rose-600 text-white hover:bg-rose-500"
                          onClick={() => remove.mutate(record.id)}
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {total === 0 ? (
                'No records'
              ) : (
                <>
                  Showing{' '}
                  <span className="font-medium text-slate-800">
                    {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)}
                  </span>{' '}
                  of <span className="font-medium text-slate-800">{total}</span>
                </>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1.5">
                <span className="text-slate-500">Rows</span>
                <select
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-800"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value) as (typeof PAGE_SIZE_OPTIONS)[number])
                    setPage(1)
                  }}
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  className="px-2 py-1.5 text-xs"
                  disabled={page <= 1 || records.isFetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="min-w-[7rem] text-center tabular-nums">
                  Page {page} / {totalPages}
                </span>
                <Button
                  type="button"
                  className="px-2 py-1.5 text-xs"
                  disabled={page >= totalPages || records.isFetching}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {detailRecord ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="detail-record-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50"
            aria-label="Close details"
            onClick={() => setDetailRecord(null)}
          />
          <div className="relative z-10 max-h-[min(90vh,720px)] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 id="detail-record-title" className="mb-1 text-lg font-semibold text-slate-900">
              Record #{detailRecord.id}
            </h3>
            <p className="mb-4 text-sm text-slate-500">
              {detailRecord.bgn_id} · {detailRecord.item_type}
            </p>
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">SPPG / Kitchen</dt>
                <dd className="mt-0.5 text-slate-900">
                  {detailRecord.nama_sppg ?? detailRecord.sppg_id ?? `Kitchen #${detailRecord.kitchen_id}`}
                </dd>
                {detailRecord.nama_sppg && detailRecord.sppg_id ? (
                  <dd className="font-mono text-xs text-slate-600">{detailRecord.sppg_id}</dd>
                ) : null}
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Item status</dt>
                <dd className="mt-1">
                  <span className={itemStatusPillClass(detailRecord.item_status)}>{itemStatusLabel(detailRecord.item_status)}</span>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Serial</dt>
                <dd className="mt-0.5 font-mono text-slate-900">{displayVal(detailRecord.items_id)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">IP</dt>
                <dd className="mt-0.5 font-mono text-slate-900">{displayVal(detailRecord.ip_address)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">MAC</dt>
                <dd className="mt-0.5 font-mono text-slate-900">{displayVal(detailRecord.mac_address)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Scan status</dt>
                <dd className="mt-1">
                  <span className={scanStatusPillClass(detailRecord.scan_status)}>{scanStatusLabel(detailRecord.scan_status)}</span>
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Router / network</dt>
                <dd className="mt-1 grid gap-2 rounded-md border border-slate-100 bg-slate-50/80 p-3 sm:grid-cols-2">
                  <span>
                    <span className="text-xs text-slate-500">IP range</span>
                    <span className="mt-0.5 block font-mono text-slate-900">{displayVal(detailRecord.ip_range)}</span>
                  </span>
                  <span>
                    <span className="text-xs text-slate-500">SSID 2.4G</span>
                    <span className="mt-0.5 block text-slate-900">{displayVal(detailRecord.ssid_24)}</span>
                  </span>
                  <span>
                    <span className="text-xs text-slate-500">Password 2.4G</span>
                    <span className="mt-0.5 block font-mono text-slate-900">{displayVal(detailRecord.password_24)}</span>
                  </span>
                  <span>
                    <span className="text-xs text-slate-500">SSID 5G</span>
                    <span className="mt-0.5 block text-slate-900">{displayVal(detailRecord.ssid_5)}</span>
                  </span>
                  <span className="sm:col-span-2">
                    <span className="text-xs text-slate-500">Password 5G</span>
                    <span className="mt-0.5 block font-mono text-slate-900">{displayVal(detailRecord.password_5)}</span>
                  </span>
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Digital signage dashboard ID</dt>
                <dd className="mt-0.5 font-mono text-slate-900">{displayVal(detailRecord.id_dashboard)}</dd>
              </div>
            </dl>
            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="mb-2 text-xs font-medium text-slate-600">Photos by workflow stage</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {PHOTO_PHASES.map(({ key, label }) => {
                  const path = detailRecord.photos?.[key]
                  const src = path ? `${detailOrigin}${path}` : null
                  return (
                    <div key={key} className="rounded border border-slate-100 p-2">
                      <p className="mb-1 text-xs text-slate-500">{label}</p>
                      {src ? (
                        <img src={src} alt={label} className="h-24 w-full rounded object-cover" />
                      ) : (
                        <div className="flex h-24 items-center justify-center rounded bg-slate-50 text-xs text-slate-400">No photo</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button type="button" className="bg-slate-200 text-slate-900 hover:bg-slate-300" onClick={() => setDetailRecord(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {editModalOpen && editingId != null ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="edit-record-title">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50"
            aria-label="Close dialog"
            onClick={closeEditModal}
          />
          <div className="relative z-10 w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 id="edit-record-title" className="mb-1 text-lg font-semibold text-slate-900">
              Edit record #{editingId}
            </h3>
            <p className="mb-4 text-sm text-slate-500">Update fields and save, or cancel to close.</p>
            <RecordFormFields form={editForm} onChange={setEditForm} />
            {updateRecord.isError ? (
              <p className="mt-2 text-sm text-rose-600">{(updateRecord.error as Error).message}</p>
            ) : null}
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" className="bg-slate-200 text-slate-900 hover:bg-slate-300" onClick={closeEditModal}>
                Cancel
              </Button>
              <Button type="button" onClick={() => updateRecord.mutate()} disabled={updateRecord.isPending}>
                {updateRecord.isPending ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  )
}
