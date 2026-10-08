import { patients } from '../data'
import DataTable from '../components/DataTable'
import Badge from '../components/Badge'
import { useAuth } from '../context/AuthContext'
import { accessForRole } from '../roleAccess'
import { ActionPlaceholder, PrototypeNotice } from '../components/PrototypeControls'

const baseColumns = [
  { key: 'name', label: 'Name' },
  { key: 'age', label: 'Age' },
  { key: 'condition', label: 'Condition' },
  { key: 'status', label: 'Status', render: (r) => <Badge label={r.status} /> },
]

export default function Patients() {
  const { user } = useAuth()
  const access = accessForRole(user?.role)
  const columns = user?.role === 'Dispatcher'
    ? baseColumns.filter((column) => ['name', 'condition'].includes(column.key))
    : [
      ...baseColumns,
      ...(user?.role === 'Hospital Admin' || user?.role === 'Lead Paramedic'
        ? [{ key: 'medicalHistory', label: 'Medical history' }]
        : []),
      ...(access.canEditPatients
        ? [{
          key: 'actions',
          label: 'Actions',
          render: () => <ActionPlaceholder>Edit patient</ActionPlaceholder>,
        }]
        : []),
    ]

  return (
    <>
      <h1>Patients</h1>
      <p className="lead">
        {user?.role === 'Dispatcher'
          ? 'Dispatch view: patient names and current conditions only.'
          : user?.role === 'Hospital Admin'
            ? 'Read-only patient records, including medical history.'
            : 'Patient information for your assigned field unit.'}
      </p>
      {access.canEditPatients && <PrototypeNotice />}
      <DataTable columns={columns} rows={patients} />
    </>
  )
}
