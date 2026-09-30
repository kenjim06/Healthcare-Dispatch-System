import { hospitals } from '../data'
import DataTable from '../components/DataTable'

const columns = [
  { key: 'name', label: 'Hospital' },
  { key: 'city', label: 'City' },
  { key: 'beds', label: 'Open beds' },
  { key: 'erWait', label: 'ER wait' },
]

export default function Hospitals() {
  return (
    <>
      <h1>Hospitals</h1>
      <p className="lead">Capacity at receiving hospitals.</p>
      <DataTable columns={columns} rows={hospitals} />
    </>
  )
}
