import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'

import { endpoints } from '../../lib/api/endpoints'
import { useEnvironmentStore } from '../../store/environmentStore'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'

const ITEM_TYPES = ['SPPG', 'CCTV', 'Digital signage + bracket', 'Router', 'Switch', 'PVR Kitchen'] as const

type UploadResponse = {
  total_rows: number
  created_kitchens: number
  created_bundles: number
  created_bgn: number
  upserted_assets: number
  errors: number
}

export function CoreUploadPage() {
  const environment = useEnvironmentStore((state) => state.environment)
  const [itemType, setItemType] = useState<(typeof ITEM_TYPES)[number]>('CCTV')
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<UploadResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const upload = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Please choose a file')
      const token = localStorage.getItem('wms_access_token')
      const form = new FormData()
      form.append('file', file)
      form.append('item_type', itemType)
      form.append('environment', environment)
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${endpoints.core.upload}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form,
      })
      if (!response.ok) throw new Error(`Upload failed: ${response.status}`)
      return (await response.json()) as UploadResponse
    },
    onSuccess: (data) => {
      setResult(data)
      setError(null)
    },
    onError: (err: Error) => {
      setError(err.message)
      setResult(null)
    },
  })

  return (
    <Card className="space-y-4">
      <h2 className="text-lg font-semibold">Core Upload</h2>
      <p className="text-xs text-slate-500">
        Minimal item file format is supported: <code>bgn_id,nama_item</code>. SPPG mapping will be auto-assigned.
      </p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <select
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={itemType}
          onChange={(e) => setItemType(e.target.value as (typeof ITEM_TYPES)[number])}
        >
          {ITEM_TYPES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <input type="file" accept=".csv,.xlsx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <Button onClick={() => upload.mutate()} disabled={!file || upload.isPending}>
          {upload.isPending ? 'Uploading...' : 'Upload'}
        </Button>
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {result ? (
        <pre className="overflow-auto rounded bg-slate-50 p-3 text-xs">{JSON.stringify(result, null, 2)}</pre>
      ) : null}
    </Card>
  )
}
