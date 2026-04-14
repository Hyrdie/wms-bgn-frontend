import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import { apiDelete, apiGet, apiPost, apiPut } from '../../lib/api/client'
import { ngrokSkipBrowserWarningHeaders } from '../../lib/api/ngrok'
import { endpoints } from '../../lib/api/endpoints'
import { useEnvironmentStore } from '../../store/environmentStore'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'

type AssetRecord = {
  id: number
  bgn_id: string
  kitchen_id: number
  bundle_id: number
  item_type: string
  items_id: string | null
  mac_address: string | null
  scan_status: string
  environment: string
}

const ITEM_TYPES = ['CCTV', 'Digital signage + bracket', 'Router', 'Switch', 'PVR Kitchen']

export function CoreRecordsPage() {
  const environment = useEnvironmentStore((state) => state.environment)
  const queryClient = useQueryClient()
  const [filterBgn, setFilterBgn] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({
    bgn_id: '',
    kitchen_id: '',
    item_type: 'CCTV',
    items_id: '',
    mac_address: '',
  })

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ environment })
    if (filterBgn.trim()) params.set('bgn_id', filterBgn.trim())
    return params.toString()
  }, [environment, filterBgn])

  const records = useQuery({
    queryKey: ['core-records', queryString],
    queryFn: () => apiGet<AssetRecord[]>(`${endpoints.core.records}?${queryString}`),
  })

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        bgn_id: form.bgn_id,
        kitchen_id: Number(form.kitchen_id),
        item_type: form.item_type,
        items_id: form.items_id || null,
        mac_address: form.mac_address || null,
        environment,
      }
      if (editingId) return apiPut(`${endpoints.core.records}/${editingId}`, payload)
      return apiPost(endpoints.core.records, payload)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['core-records'] })
      setEditingId(null)
      setForm({ bgn_id: '', kitchen_id: '', item_type: 'CCTV', items_id: '', mac_address: '' })
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

      <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
        <Input placeholder="BGN ID" value={form.bgn_id} onChange={(e) => setForm((p) => ({ ...p, bgn_id: e.target.value }))} />
        <Input
          placeholder="Kitchen ID"
          type="number"
          value={form.kitchen_id}
          onChange={(e) => setForm((p) => ({ ...p, kitchen_id: e.target.value }))}
        />
        <select
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={form.item_type}
          onChange={(e) => setForm((p) => ({ ...p, item_type: e.target.value }))}
        >
          {ITEM_TYPES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <Input
          placeholder="ITEMS ID (serial)"
          value={form.items_id}
          onChange={(e) => setForm((p) => ({ ...p, items_id: e.target.value }))}
        />
        <Input
          placeholder="MAC address"
          value={form.mac_address}
          onChange={(e) => setForm((p) => ({ ...p, mac_address: e.target.value }))}
        />
      </div>
      <Button onClick={() => save.mutate()}>{editingId ? 'Update Record' : 'Create Record'}</Button>

      <div className="space-y-2">
        {(records.data ?? []).map((record) => (
          <div key={record.id} className="flex items-center justify-between rounded-md border border-slate-200 p-2 text-sm">
            <div>
              #{record.id} | {record.bgn_id} | {record.item_type} | serial:{record.items_id ?? '-'} | kitchen:{' '}
              {record.kitchen_id} | scan:{record.scan_status}
            </div>
            <div className="flex gap-2">
              <Button
                className="bg-indigo-600 hover:bg-indigo-500"
                onClick={() => {
                  setEditingId(record.id)
                  setForm({
                    bgn_id: record.bgn_id,
                    kitchen_id: String(record.kitchen_id),
                    item_type: record.item_type,
                    items_id: record.items_id ?? '',
                    mac_address: record.mac_address ?? '',
                  })
                }}
              >
                Edit
              </Button>
              <Button className="bg-rose-600 hover:bg-rose-500" onClick={() => remove.mutate(record.id)}>
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
