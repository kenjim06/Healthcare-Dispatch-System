import { patients } from '../data'
import DataTable from '../components/DataTable'
import Badge from '../components/Badge'

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'age', label: 'Age' },
  { key: 'condition', label: 'Condition' },
  { key: 'status', label: 'Status', render: (r) => <Badge label={r.status} /> },
]

export default function Patients() {
  return (
    <>
      <h1>Patients</h1>
      <p className="lead">Everyone currently in the system.</p>
      <DataTable columns={columns} rows={patients} />
    </>
  )
}
