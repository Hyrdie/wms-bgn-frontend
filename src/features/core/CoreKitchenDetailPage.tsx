import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { apiGet, apiPut } from '../../lib/api/client'
import { endpoints } from '../../lib/api/endpoints'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'

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
  scan_status: string
}

export function CoreKitchenDetailPage() {
  const params = useParams()
  const queryClient = useQueryClient()
  const kitchenId = Number(params.kitchenId)
  const [serialById, setSerialById] = useState<Record<number, string>>({})
  const [message, setMessage] = useState('')

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

  const saveAll = useMutation({
    mutationFn: () =>
      apiPut<KitchenItem[], { items: Array<{ id: number; items_id: string | null }> }>(
        `${endpoints.core.kitchenItemsSave}/${kitchenId}/items`,
        {
          items: itemCards.map(({ row }) => ({
            id: row.id,
            items_id: (serialById[row.id] ?? '').trim() || null,
          })),
        },
      ),
    onSuccess: (data) => {
      setMessage(`Saved serial numbers for ${data.length} mapped items.`)
      void queryClient.invalidateQueries({ queryKey: ['core-kitchen-items', kitchenId] })
    },
    onError: (error: Error) => setMessage(error.message),
  })

  const order = ['CCTV', 'Digital signage + bracket', 'Router', 'Switch', 'PVR Kitchen']
  const grouped = new Map<string, KitchenItem[]>()
  for (const row of items.data ?? []) {
    if (!grouped.has(row.item_type)) grouped.set(row.item_type, [])
    grouped.get(row.item_type)?.push(row)
  }

  const itemCards: Array<{ title: string; row: KitchenItem }> = []
  for (const itemType of order) {
    const rows = grouped.get(itemType) ?? []
    rows.forEach((row, index) => {
      const title = itemType === 'CCTV' ? `CCTV ${index + 1}` : itemType
      itemCards.push({ title, row })
    })
  }

  if (!Number.isFinite(kitchenId)) {
    return <Card>Invalid kitchen id.</Card>
  }

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
        <div className="space-y-2">
          {itemCards.map(({ title, row }) => (
            <div key={row.id} className="rounded-md border border-slate-200 p-3">
              <h4 className="mb-2 text-sm font-semibold text-slate-800">{title}</h4>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">BGN ID</p>
                  <Input readOnly value={row.bgn_id} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">MAC Address</p>
                  <Input readOnly value={row.mac_address ?? '-'} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Serial Number (scan result)</p>
                  <Input
                    autoFocus={title === 'CCTV 1'}
                    placeholder="Scan / input serial number"
                    value={serialById[row.id] ?? row.items_id ?? ''}
                    onChange={(e) =>
                      setSerialById((prev) => ({
                        ...prev,
                        [row.id]: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Scan Status</p>
                  <Input readOnly value={(serialById[row.id] ?? '').trim() ? 'scanned' : 'pending'} />
                </div>
              </div>
            </div>
          ))}
          {!itemCards.length ? <p className="text-sm text-slate-500">No mapped items yet.</p> : null}
        </div>
        <div className="flex items-center justify-end gap-2">
          {message ? <p className="mr-auto text-sm text-slate-700">{message}</p> : null}
          <Button onClick={() => saveAll.mutate()} disabled={saveAll.isPending || !itemCards.length}>
            {saveAll.isPending ? 'Saving...' : 'Save All Serials'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
