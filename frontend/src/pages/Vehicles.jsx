import { vehicles } from '../data'
import DataTable from '../components/DataTable'
import Badge from '../components/Badge'
import { useAuth } from '../context/AuthContext'
import { accessForRole } from '../roleAccess'
import { ActionPlaceholder, FieldPlaceholder, PrototypeNotice } from '../components/PrototypeControls'

const baseColumns = [
  { key: 'id', label: 'Vehicle' },
  { key: 'status', label: 'Status', render: (r) => <Badge label={r.status} /> },
  { key: 'location', label: 'Location' },
  { key: 'crew', label: 'Crew' },
]

export default function Vehicles() {
  const { user } = useAuth()
  const access = accessForRole(user?.role)
  const visibleVehicles = user?.role === 'Lead Paramedic'
    ? vehicles.filter((vehicle) => vehicle.badge === user.badge)
    : vehicles
  const columns = user?.role === 'Hospital Admin'
    ? [
      ...baseColumns,
      { key: 'badge', label: 'Assigned paramedic' },
      { key: 'area', label: 'Service area' },
      { key: 'notes', label: 'Vehicle information' },
    ]
    : access.canManageVehicles
      ? [
        ...baseColumns,
        { key: 'notes', label: 'Vehicle information' },
        {
          key: 'actions',
          label: 'Actions',
          render: () => <ActionPlaceholder>Add / edit information</ActionPlaceholder>,
        },
      ]
      : baseColumns

  return (
    <>
      <h1>EMS vehicles</h1>
      <p className="lead">
        {user?.role === 'Dispatcher'
          ? 'Vehicle status and information for dispatch coordination.'
          : user?.role === 'Lead Paramedic'
            ? 'Vehicle assigned to your field unit.'
            : 'Read-only vehicle and assignment records.'}
      </p>
      {access.canManageVehicles && <PrototypeNotice />}
      {access.canManageVehicles && (
        <section className="panel prototype-panel">
          <h2>Add vehicle information</h2>
          <div className="prototype-form">
            <FieldPlaceholder label="Vehicle" value="Select vehicle" />
            <FieldPlaceholder label="Location" />
            <FieldPlaceholder label="Status" value="Select status" />
            <FieldPlaceholder label="Crew and notes" multiline />
            <ActionPlaceholder>Save vehicle information</ActionPlaceholder>
          </div>
        </section>
      )}
      {visibleVehicles.length
        ? <DataTable columns={columns} rows={visibleVehicles} />
        : <p className="panel empty-state">No vehicle is linked to this paramedic demo account.</p>}
    </>
  )
}
