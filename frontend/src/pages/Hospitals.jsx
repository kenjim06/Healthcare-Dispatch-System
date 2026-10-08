import { hospitals, vehicles } from '../data'
import DataTable from '../components/DataTable'
import { useAuth } from '../context/AuthContext'
import { accessForRole } from '../roleAccess'

const baseColumns = [
  { key: 'name', label: 'Hospital' },
  { key: 'city', label: 'City' },
  { key: 'beds', label: 'Open beds' },
  { key: 'erWait', label: 'ER wait' },
]

export default function Hospitals() {
  const { user } = useAuth()
  const access = accessForRole(user?.role)
  const vehicle = vehicles.find((item) => item.badge === user?.badge)
  const visibleHospitals = user?.role === 'Lead Paramedic' && vehicle?.area
    ? hospitals.filter((hospital) => hospital.area === vehicle.area)
    : hospitals
  const columns = access.canViewAllRecords
    ? [...baseColumns, { key: 'area', label: 'Service area' }]
    : baseColumns

  return (
    <>
      <h1>{user?.role === 'Lead Paramedic' ? 'Area hospitals' : 'Hospitals'}</h1>
      <p className="lead">
        {user?.role === 'Lead Paramedic'
          ? `Receiving hospitals in your service area${vehicle?.area ? ` (${vehicle.area})` : ''}.`
          : 'Read-only hospital capacity and service-area records.'}
      </p>
      <DataTable columns={columns} rows={visibleHospitals} />
    </>
  )
}
