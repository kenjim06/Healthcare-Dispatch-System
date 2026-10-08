import { emergencies, patients, vehicles } from '../data'
import EmergencyRow from '../components/EmergencyRow'
import { useAuth } from '../context/AuthContext'
import { accessForRole } from '../roleAccess'
import {
  ActionPlaceholder,
  FieldPlaceholder,
  PrototypeNotice,
  SelectPlaceholder,
} from '../components/PrototypeControls'

function EmergencyDraft({ role }) {
  return (
    <section className="panel prototype-panel">
      <h2>{role === 'Dispatcher' ? 'New emergency' : 'Report an emergency'}</h2>
      <div className="prototype-form">
        <FieldPlaceholder label="Address" />
        <SelectPlaceholder label="Patient" value="Select a patient" options={['Select a patient', ...patients.map((patient) => patient.name)]} />
        <SelectPlaceholder label="Priority" value="Select priority" options={['Select priority', 'High', 'Medium', 'Low']} />
        <SelectPlaceholder
          label={role === 'Dispatcher' ? 'Assign vehicle' : 'Assign to my EMS vehicle'}
          value={role === 'Dispatcher' ? 'Unassigned' : 'AMB-002'}
          options={role === 'Dispatcher' ? ['Unassigned', ...vehicles.map((vehicle) => vehicle.id)] : ['AMB-002']}
        />
        <ActionPlaceholder>Add emergency</ActionPlaceholder>
      </div>
    </section>
  )
}

export default function Emergencies() {
  const { user } = useAuth()
  const access = accessForRole(user?.role)
  const visibleEmergencies = user?.role === 'Lead Paramedic'
    ? emergencies.filter((emergency) => emergency.assignedParamedicBadge === user.badge)
    : emergencies

  return (
    <>
      <h1>Emergencies</h1>
      <p className="lead">
        {user?.role === 'Dispatcher'
          ? 'Manage the queue and coordinate paramedic assignments.'
          : user?.role === 'Lead Paramedic'
            ? 'Emergencies assigned to your field unit.'
            : 'Read-only view of all emergencies and assignment records.'}
      </p>
      {(access.canManageEmergencies || access.canCreateEmergencies || access.canEditAssignedEmergencies)
        && <PrototypeNotice />}
      {(access.canManageEmergencies || access.canCreateEmergencies)
        && <EmergencyDraft role={user.role} />}
      {visibleEmergencies.map((emergency) => (
        <section className="emergency-item" key={emergency.id}>
          <EmergencyRow e={emergency} />
          {access.canManageEmergencies && (
            <div className="prototype-actions">
              <ActionPlaceholder>Edit emergency</ActionPlaceholder>
              <ActionPlaceholder>Delete emergency</ActionPlaceholder>
              <div className="prototype-form">
                <SelectPlaceholder
                  label="Assign paramedic"
                  value="Capt. Marcus Vance (EMS-401)"
                  options={['Select paramedic', 'Capt. Marcus Vance (EMS-401)']}
                />
                <FieldPlaceholder label="Assignment message" multiline />
                <ActionPlaceholder>Assign and send message</ActionPlaceholder>
              </div>
            </div>
          )}
          {access.canEditAssignedEmergencies && (
            <div className="prototype-actions">
              <ActionPlaceholder>Edit assigned emergency</ActionPlaceholder>
              <ActionPlaceholder>Assign to my EMS vehicle</ActionPlaceholder>
              {emergency.assignmentMessage && (
                <p className="assignment-message">
                  <strong>Dispatcher message:</strong> {emergency.assignmentMessage}
                </p>
              )}
              <div className="muted">
                Your vehicle: {vehicles.find((vehicle) => vehicle.badge === user.badge)?.id ?? 'Not linked'}
              </div>
            </div>
          )}
          {access.canViewAllRecords && (
            <p className="muted">
              Assigned paramedic: {emergency.assignedParamedicBadge ?? 'Unassigned'}
              {emergency.assignmentMessage && ` · Message: ${emergency.assignmentMessage}`}
            </p>
          )}
        </section>
      ))}
      {user?.role === 'Lead Paramedic' && visibleEmergencies.length === 0 && (
        <p className="panel empty-state">No emergencies are assigned to this field unit in the demo data.</p>
      )}
    </>
  )
}
