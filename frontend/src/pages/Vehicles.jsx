import { vehicles } from '../data'
import DataTable from '../components/DataTable'
import Badge from '../components/Badge'

const columns = [
  { key: 'id', label: 'Vehicle' },
  { key: 'status', label: 'Status', render: (r) => <Badge label={r.status} /> },
  { key: 'location', label: 'Location' },
  { key: 'crew', label: 'Crew' },
]

export default function Vehicles() {
  return (
    <>
      <h1>EMS vehicles</h1>
      <p className="lead">Where each ambulance is and whether it can take a call.</p>
      <DataTable columns={columns} rows={vehicles} />
    </>
  )
}
