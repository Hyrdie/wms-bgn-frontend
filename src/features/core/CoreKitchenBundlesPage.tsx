import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { apiGet } from '../../lib/api/client'
import { endpoints } from '../../lib/api/endpoints'
import { useEnvironmentStore } from '../../store/environmentStore'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'

type Kitchen = {
  id: number
  sppg_id: string
  nama_sppg: string | null
}

type Bundle = {
  id: number
  kitchen_id: number
  bundle_code: string | null
}

type BundleDetail = {
  bundle: Bundle
  composition: {
    complete: boolean
    missing: Record<string, number>
    extra: Record<string, number>
  }
}

export function CoreKitchenBundlesPage() {
  const environment = useEnvironmentStore((state) => state.environment)
  const navigate = useNavigate()
  const kitchens = useQuery({
    queryKey: ['core-kitchens', environment],
    queryFn: () => apiGet<Kitchen[]>(`${endpoints.core.kitchens}?environment=${environment}`),
  })
  const bundles = useQuery({
    queryKey: ['core-bundles', environment],
    queryFn: () => apiGet<Bundle[]>(`${endpoints.core.bundles}?environment=${environment}`),
  })

  return (
    <Card className="space-y-4">
      <h2 className="text-lg font-semibold">Kitchen / Bundle Overview ({environment})</h2>
      <p className="text-sm text-slate-500">
        Focus view: check missing items quickly, then open details to fill serial numbers.
      </p>
      {kitchens.isError || bundles.isError ? (
        <p className="text-sm text-rose-600">
          Failed to load kitchens/bundles:{' '}
          {(kitchens.error as Error | undefined)?.message ??
            (bundles.error as Error | undefined)?.message ??
            'Unknown error'}
          . Check Vercel <code className="rounded bg-slate-100 px-1">VITE_API_BASE_URL</code> and backend CORS
          (include your Vercel origin or use preview-safe CORS).
        </p>
      ) : null}
      <div className="space-y-2">
        {(bundles.data ?? []).map((bundle) => (
          <BundleRow
            key={bundle.id}
            bundle={bundle}
            kitchens={kitchens.data ?? []}
            onViewItems={(kitchenId) => navigate(`/core/kitchens/${kitchenId}`)}
          />
        ))}
      </div>
    </Card>
  )
}

function BundleRow({
  bundle,
  kitchens,
  onViewItems,
}: {
  bundle: Bundle
  kitchens: Kitchen[]
  onViewItems: (kitchenId: number) => void
}) {
  const detail = useQuery({
    queryKey: ['core-bundle-detail', bundle.id],
    queryFn: () => apiGet<BundleDetail>(`${endpoints.core.bundles}/${bundle.id}`),
  })
  const kitchen = kitchens.find((item) => item.id === bundle.kitchen_id)
  const missingEntries = Object.entries(detail.data?.composition.missing ?? {})
  const isComplete = Boolean(detail.data?.composition.complete)

  return (
    <div className="rounded-md border border-slate-200 p-4 text-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="font-semibold text-slate-800">
            {kitchen?.nama_sppg ?? '-'} ({kitchen?.sppg_id ?? '-'})
          </div>
          <div className="text-xs text-slate-500">
            Bundle #{bundle.id} | Code: {bundle.bundle_code ?? '-'}
          </div>
        </div>
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${
            isComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
          }`}
        >
          {isComplete ? 'Complete' : 'Incomplete'}
        </span>
      </div>

      <div className="mb-3 rounded-md bg-slate-50 p-3">
        <div className="mb-1 text-xs font-medium text-slate-600">Missing Items</div>
        {missingEntries.length ? (
          <div className="flex flex-wrap gap-2">
            {missingEntries.map(([item, qty]) => (
              <span key={item} className="rounded bg-amber-100 px-2 py-1 text-xs text-amber-800">
                {item}: {qty}
              </span>
            ))}
          </div>
        ) : (
          <div className="text-xs text-emerald-700">No missing items</div>
        )}
      </div>

      <div className="flex justify-end">
        <Button onClick={() => onViewItems(bundle.kitchen_id)}>View Items</Button>
      </div>
    </div>
  )
}
