import { useEnvironmentStore } from '../../store/environmentStore'

export function EnvironmentSwitcher() {
  const environment = useEnvironmentStore((state) => state.environment)
  const setEnvironment = useEnvironmentStore((state) => state.setEnvironment)

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-slate-600">Item Status:</span>
      <select
        className="rounded-md border border-slate-300 px-2 py-1"
        value={environment}
        onChange={(e) => setEnvironment(e.target.value as 'staging' | 'imple')}
      >
        <option value="staging">Warehouse Testing</option>
        <option value="imple">Implementation</option>
      </select>
    </div>
  )
}
