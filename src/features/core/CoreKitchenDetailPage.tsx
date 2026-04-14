import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { apiGet, apiPut } from '../../lib/api/client'
import { endpoints } from '../../lib/api/endpoints'
import { apiPublicOrigin } from '../../lib/api/origin'
import { ngrokSkipBrowserWarningHeaders } from '../../lib/api/ngrok'
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

type Kitchen = {
  id: number
  sppg_id: string
  nama_sppg: string | null
  environment: string
}

type KitchenItem = {
  id: number
  bgn_id: string
  item_type: string
  items_id: string | null
  mac_address: string | null
  ip_address?: string | null
  item_status?: string | null
  photos?: Record<string, string | null> | null
  ip_range?: string | null
  ssid_24?: string | null
  password_24?: string | null
  ssid_5?: string | null
  password_5?: string | null
  id_dashboard?: string | null
  scan_status: string
}

type ItemForm = {
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

const ORDER = ['CCTV', 'Digital signage + bracket', 'Router', 'Switch', 'PVR Kitchen', 'Laptop'] as const

const PHOTO_PHASES: { key: ItemStatus; label: string }[] = [
  { key: 'warehouse', label: 'Warehouse' },
  { key: 'staging', label: 'Staging' },
  { key: 'implementation', label: 'Implementation' },
]

function rowToForm(r: KitchenItem): ItemForm {
  const raw = (r.item_status || 'warehouse').toLowerCase()
  const st: ItemStatus =
    raw === 'staging' || raw === 'implementation' || raw === 'warehouse' ? (raw as ItemStatus) : 'warehouse'
  return {
    items_id: r.items_id ?? '',
    mac_address: r.mac_address ?? '',
    ip_address: r.ip_address ?? '',
    item_status: st,
    ip_range: r.ip_range ?? '',
    ssid_24: r.ssid_24 ?? '',
    password_24: r.password_24 ?? '',
    ssid_5: r.ssid_5 ?? '',
    password_5: r.password_5 ?? '',
    id_dashboard: r.id_dashboard ?? '',
  }
}

export function CoreKitchenDetailPage() {
  const params = useParams()
  const queryClient = useQueryClient()
  const kitchenId = Number(params.kitchenId)
  const [formsById, setFormsById] = useState<Record<number, ItemForm>>({})
  const [message, setMessage] = useState('')
  const [photoBusy, setPhotoBusy] = useState<number | null>(null)

  const kitchen = useQuery({
    queryKey: ['core-kitchen', kitchenId],
    queryFn: () => apiGet<Kitchen>(`${endpoints.core.kitchens}/${kitchenId}`),
    enabled: Number.isFinite(kitchenId),
  })

  const items = useQuery({
    queryKey: ['core-kitchen-items', kitchenId],
    queryFn: () => apiGet<KitchenItem[]>(`${endpoints.core.kitchenItems}/${kitchenId}/items`),
    enabled: Number.isFinite(kitchenId),
  })

  useEffect(() => {
    if (!items.data?.length) return
    const next: Record<number, ItemForm> = {}
    for (const r of items.data) {
      next[r.id] = rowToForm(r)
    }
    setFormsById(next)
  }, [items.data])

  const grouped = useMemo(() => {
    const g = new Map<string, KitchenItem[]>()
    for (const row of items.data ?? []) {
      if (!g.has(row.item_type)) g.set(row.item_type, [])
      g.get(row.item_type)?.push(row)
    }
    return g
  }, [items.data])

  const itemCards = useMemo(() => {
    const cards: Array<{ title: string; row: KitchenItem }> = []
    for (const itemType of ORDER) {
      const rows = grouped.get(itemType) ?? []
      rows.forEach((row, index) => {
        const title = itemType === 'CCTV' ? `CCTV ${index + 1}` : itemType
        cards.push({ title, row })
      })
    }
    const seen = new Set(cards.map((c) => c.row.id))
    for (const row of items.data ?? []) {
      if (!seen.has(row.id)) {
        cards.push({ title: row.item_type, row })
      }
    }
    return cards
  }, [grouped, items.data])

  const patchForm = (id: number, patch: Partial<ItemForm>) => {
    setFormsById((prev) => {
      const row = items.data?.find((r) => r.id === id)
      const base = prev[id] ?? (row ? rowToForm(row) : null)
      if (!base) return prev
      return { ...prev, [id]: { ...base, ...patch } }
    })
  }

  const saveAll = useMutation({
    mutationFn: () => {
      const payload = {
        items: itemCards.map(({ row }) => {
          const f = formsById[row.id] ?? rowToForm(row)
          return {
            id: row.id,
            items_id: f.items_id.trim() || null,
            mac_address: f.mac_address.trim() || null,
            ip_address: f.ip_address.trim() || null,
            item_status: f.item_status,
            ip_range: f.ip_range.trim() || null,
            ssid_24: f.ssid_24.trim() || null,
            password_24: f.password_24.trim() || null,
            ssid_5: f.ssid_5.trim() || null,
            password_5: f.password_5.trim() || null,
            id_dashboard: f.id_dashboard.trim() || null,
          }
        }),
      }
      return apiPut<KitchenItem[], typeof payload>(`${endpoints.core.kitchenItemsSave}/${kitchenId}/items`, payload)
    },
    onSuccess: (data) => {
      setMessage(`Saved ${data.length} items. Serial filled → staging is applied automatically when applicable.`)
      void queryClient.invalidateQueries({ queryKey: ['core-kitchen-items', kitchenId] })
    },
    onError: (error: Error) => setMessage(error.message),
  })

  const uploadPhoto = async (recordId: number, phase: ItemStatus, file: File) => {
    setPhotoBusy(recordId)
    setMessage('')
    try {
      const token = localStorage.getItem('wms_access_token')
      const body = new FormData()
      body.append('phase', phase)
      body.append('file', file)
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}${endpoints.core.recordPhoto(recordId)}`,
        {
          method: 'POST',
          headers: {
            ...ngrokSkipBrowserWarningHeaders(),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body,
        },
      )
      if (!res.ok) throw new Error(`Photo upload failed: ${res.status}`)
      void queryClient.invalidateQueries({ queryKey: ['core-kitchen-items', kitchenId] })
      setMessage('Photo uploaded.')
    } catch (e) {
      setMessage((e as Error).message)
    } finally {
      setPhotoBusy(null)
    }
  }

  if (!Number.isFinite(kitchenId)) {
    return <Card>Invalid kitchen id.</Card>
  }

  const origin = apiPublicOrigin()

  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">SPPG/Kitchen Details</h2>
          <Link to="/core/overview" className="text-sm text-slate-700 underline">
            Back to SPPG/Kitchens
          </Link>
        </div>
        <p className="text-sm text-slate-600">
          SPPG ID: <span className="font-medium">{kitchen.data?.sppg_id ?? '-'}</span> | Name:{' '}
          <span className="font-medium">{kitchen.data?.nama_sppg ?? '-'}</span>
        </p>
      </Card>

      <Card className="space-y-3">
        <h3 className="text-base font-semibold">Mapped Items</h3>
        <p className="text-xs text-slate-500">
          Item workflow status (Warehouse → Staging → Implementation) is per device. Saving a serial moves new items from
          Warehouse to Staging automatically.
        </p>
        <div className="space-y-3">
          {itemCards.map(({ title, row }) => {
            const f = formsById[row.id] ?? rowToForm(row)
            const isRouter = row.item_type === 'Router'
            const isSignage = row.item_type === 'Digital signage + bracket'
            return (
              <div key={row.id} className="rounded-md border border-slate-200 p-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <span className={itemStatusPillClass(f.item_status)}>{itemStatusLabel(f.item_status)}</span>
                    <span
                      className={scanStatusPillClass(row.scan_status)}
                      title="Whether a serial number is recorded for this item"
                    >
                      {scanStatusLabel(row.scan_status)}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <div>
                    <p className="text-xs text-slate-500">BGN ID</p>
                    <Input readOnly value={row.bgn_id} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Item status</p>
                    <select
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                      value={f.item_status}
                      onChange={(e) => patchForm(row.id, { item_status: e.target.value as ItemStatus })}
                    >
                      {ITEM_STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Serial number</p>
                    <Input
                      autoFocus={title === 'CCTV 1'}
                      placeholder="Scan / type serial"
                      value={f.items_id}
                      onChange={(e) => patchForm(row.id, { items_id: e.target.value })}
                    />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">MAC address</p>
                    <Input
                      value={f.mac_address}
                      onChange={(e) => patchForm(row.id, { mac_address: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs text-slate-500">IP address</p>
                    <Input
                      value={f.ip_address}
                      onChange={(e) => patchForm(row.id, { ip_address: e.target.value })}
                    />
                  </div>
                  {isSignage ? (
                    <div className="md:col-span-2">
                      <p className="text-xs text-slate-500">ID dashboard</p>
                      <Input
                        value={f.id_dashboard}
                        onChange={(e) => patchForm(row.id, { id_dashboard: e.target.value })}
                      />
                    </div>
                  ) : null}
                  {isRouter ? (
                    <>
                      <div className="md:col-span-2">
                        <p className="text-xs text-slate-500">IP range</p>
                        <Input
                          value={f.ip_range}
                          onChange={(e) => patchForm(row.id, { ip_range: e.target.value })}
                        />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">SSID 2.4G</p>
                        <Input
                          value={f.ssid_24}
                          onChange={(e) => patchForm(row.id, { ssid_24: e.target.value })}
                        />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Password 2.4G</p>
                        <Input
                          type="password"
                          value={f.password_24}
                          onChange={(e) => patchForm(row.id, { password_24: e.target.value })}
                        />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">SSID 5G</p>
                        <Input value={f.ssid_5} onChange={(e) => patchForm(row.id, { ssid_5: e.target.value })} />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Password 5G</p>
                        <Input
                          type="password"
                          value={f.password_5}
                          onChange={(e) => patchForm(row.id, { password_5: e.target.value })}
                        />
                      </div>
                    </>
                  ) : null}
                </div>
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <p className="mb-2 text-xs font-medium text-slate-600">Photos by workflow stage</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {PHOTO_PHASES.map(({ key, label }) => {
                      const path = row.photos?.[key]
                      const src = path ? `${origin}${path}` : null
                      return (
                        <div key={key} className="rounded border border-slate-100 p-2">
                          <p className="mb-1 text-xs text-slate-500">{label}</p>
                          {src ? (
                            <img src={src} alt={label} className="mb-2 h-24 w-full rounded object-cover" />
                          ) : (
                            <div className="mb-2 flex h-24 items-center justify-center rounded bg-slate-50 text-xs text-slate-400">
                              No photo
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="w-full text-xs"
                            disabled={photoBusy === row.id}
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) void uploadPhoto(row.id, key, file)
                              e.target.value = ''
                            }}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
          {!itemCards.length ? <p className="text-sm text-slate-500">No mapped items yet.</p> : null}
        </div>
        <div className="flex items-center justify-end gap-2">
          {message ? <p className="mr-auto text-sm text-slate-700">{message}</p> : null}
          <Button onClick={() => saveAll.mutate()} disabled={saveAll.isPending || !itemCards.length}>
            {saveAll.isPending ? 'Saving...' : 'Save all items'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
