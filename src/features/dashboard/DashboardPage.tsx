import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'

export function DashboardPage() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card>
        <p className="text-sm text-slate-500">Available Stock</p>
        <p className="text-2xl font-bold">195 Units</p>
      </Card>
      <Card>
        <p className="text-sm text-slate-500">Inbound Queue</p>
        <p className="text-2xl font-bold">8 Tasks</p>
      </Card>
      <Card>
        <p className="text-sm text-slate-500">Outbound Queue</p>
        <p className="text-2xl font-bold">11 Tasks</p>
      </Card>
      <Card>
        <p className="mb-2 text-sm text-slate-500">Alerts</p>
        <Badge label="3 Low Stock" variant="warning" />
      </Card>
    </div>
  )
}
