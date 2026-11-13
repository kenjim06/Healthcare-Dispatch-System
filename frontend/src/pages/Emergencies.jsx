import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import EmergencyLocationPicker from '../components/EmergencyLocationPicker'
import LocationWorkspace, { SelectableList } from '../components/LocationWorkspace'
import PatientProfileDialog from '../components/PatientProfileDialog'
import { useAuth } from '../context/AuthContext'
import { useOperations } from '../context/OperationsContext'
import { accessForRole } from '../roleAccess'

function NewEmergencyForm({ user, vehicles, patients, onCreate }) {
  const ownVehicle = vehicles.find((vehicle) => vehicle.badge === user.badge)
  const availableVehicles = vehicles.filter((vehicle) => vehicle.status === 'Available')
  const isDispatcher = user.role === 'Dispatcher'
  const [patientName, setPatientName] = useState('')
  const [patientId, setPatientId] = useState('')
  const [address, setAddress] = useState('')
  const [position, setPosition] = useState(null)
  const [priority, setPriority] = useState('High')
  const [vehicleId, setVehicleId] = useState('')
  const [message, setMessage] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    const assignedVehicle = isDispatcher
      ? vehicles.find((vehicle) => vehicle.id === vehicleId)
      : ownVehicle
    const created = await onCreate({
      patientName: patients.find((patient) => patient.id === Number(patientId))?.name
        ?? patientName.trim(),
      ...(patientId ? { patientId: Number(patientId) } : {}),
      address: address.trim(),
      position,
      priority,
      status: assignedVehicle ? 'En route' : 'Awaiting dispatch',
      vehicle: assignedVehicle?.id ?? null,
      assignedParamedicBadge: isDispatcher ? assignedVehicle?.badge ?? null : user.badge,
      assignmentMessage: isDispatcher ? message.trim() : '',
    })
    if (created) {
      setPatientName('')
      setPatientId('')
      setAddress('')
      setPosition(null)
      setMessage('')
    }
  }

  return (
    <form className="panel prototype-panel detail-form" onSubmit={submit}>
      <h2>New emergency</h2>
      {patients.length > 0 && (
        <label>Link patient record
          <select className="form-control" value={patientId} onChange={(event) => setPatientId(event.target.value)}>
            <option value="">New patient record</option>
            {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}
          </select>
        </label>
      )}
      {!patientId && (
        <label>Patient name<input className="form-control" value={patientName} onChange={(event) => setPatientName(event.target.value)} maxLength="255" required /></label>
      )}
      <label>Incident address<input className="form-control" value={address} onChange={(event) => setAddress(event.target.value)} required /></label>
      <label className="location-picker-label"><strong>Incident location on map</strong>
        <EmergencyLocationPicker position={position} onChange={setPosition} />
      </label>
      <label>Priority
        <select className="form-control" value={priority} onChange={(event) => setPriority(event.target.value)}>
          {['High', 'Medium', 'Low'].map((value) => <option key={value}>{value}</option>)}
        </select>
      </label>
      {isDispatcher ? (
        <>
          <label>Assign vehicle
            <select className="form-control" value={vehicleId} onChange={(event) => setVehicleId(event.target.value)}>
              <option value="">Unassigned</option>
              {availableVehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.id}</option>)}
            </select>
          </label>
          <label>Assignment message<textarea className="form-control" value={message} onChange={(event) => setMessage(event.target.value)} rows="2" /></label>
        </>
      ) : (
        <p className="muted">
          Assigned vehicle: {ownVehicle?.id ?? 'No vehicle linked to this account'}
          {ownVehicle && ownVehicle.status !== 'Available' ? ` · ${ownVehicle.status}` : ''}
        </p>
      )}
      <button
        className="btn-primary"
        type="submit"
        disabled={!position || (!isDispatcher && (!ownVehicle || ownVehicle.status !== 'Available'))}
      >
        Add to queue
      </button>
    </form>
  )
}

function EmergencyEditor({ emergency, user, patients, vehicles, onSave, onCancel, onDelete }) {
  const isDispatcher = user.role === 'Dispatcher'
  const ownVehicle = vehicles.find((vehicle) => vehicle.badge === user.badge)
  const [address, setAddress] = useState(emergency.address)
  const [patientId, setPatientId] = useState(String(emergency.patientId ?? ''))
  const [patientName, setPatientName] = useState(emergency.patient ?? '')
  const [linkPatientId, setLinkPatientId] = useState('')
  const [position, setPosition] = useState(emergency.position)
  const [priority, setPriority] = useState(emergency.priority)
  const [status, setStatus] = useState(emergency.status)
  const [vehicleId, setVehicleId] = useState(emergency.vehicle ?? '')
  const [message, setMessage] = useState(emergency.assignmentMessage ?? '')
  const assignableVehicles = vehicles.filter(
    (vehicle) => vehicle.status === 'Available' || vehicle.id === emergency.vehicle,
  )

  const submit = async (event) => {
    event.preventDefault()
    const vehicle = isDispatcher
      ? vehicles.find((item) => item.id === vehicleId)
      : ownVehicle
    const saved = await onSave({
      address: address.trim(),
      position,
      ...(emergency.patientId
        ? { patientId: Number(patientId) }
        : linkPatientId
          ? { patientId: Number(linkPatientId) }
          : { patientName: patientName.trim() }),
      priority,
      status,
      vehicle: vehicle?.id ?? null,
      ...(isDispatcher
        ? { assignedParamedicBadge: vehicle?.badge ?? null, assignmentMessage: message.trim() }
        : { assignedParamedicBadge: user.badge }),
    })
    if (!saved) return
  }

  return (
    <form className="detail-form" onSubmit={submit}>
      {emergency.patientId ? (
        <label className="detail-line"><strong>Patient</strong>
          <select className="form-control" value={patientId} onChange={(event) => setPatientId(event.target.value)}>
            {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}
          </select>
        </label>
      ) : (
        <>
          <label className="detail-line"><strong>Patient name</strong><input className="form-control" value={patientName} onChange={(event) => setPatientName(event.target.value)} maxLength="255" required /></label>
          {patients.length > 0 && (
            <label className="detail-line"><strong>Link patient record</strong>
              <select className="form-control" value={linkPatientId} onChange={(event) => setLinkPatientId(event.target.value)}>
                <option value="">Not linked</option>
                {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}
              </select>
            </label>
          )}
        </>
      )}
      <label className="detail-line"><strong>Address</strong><input className="form-control" value={address} onChange={(event) => setAddress(event.target.value)} required /></label>
      <label className="detail-line location-picker-label"><strong>Incident location on map</strong>
        <EmergencyLocationPicker position={position} onChange={setPosition} />
      </label>
      <label className="detail-line"><strong>Priority</strong>
        <select className="form-control" value={priority} onChange={(event) => setPriority(event.target.value)}>
          {['High', 'Medium', 'Low'].map((value) => <option key={value}>{value}</option>)}
        </select>
      </label>
      <label className="detail-line"><strong>Status</strong>
        <select className="form-control" value={status} onChange={(event) => setStatus(event.target.value)}>
          {['Awaiting dispatch', 'En route', 'On scene', 'Transporting'].map((value) => <option key={value}>{value}</option>)}
        </select>
      </label>
      {isDispatcher ? (
        <>
          <label className="detail-line"><strong>EMS vehicle</strong>
            <select className="form-control" value={vehicleId} onChange={(event) => setVehicleId(event.target.value)}>
              <option value="">Unassigned</option>
              {assignableVehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.id} · {vehicle.status}</option>)}
            </select>
          </label>
          <p className="detail-line"><strong>Assigned paramedic</strong><span>{vehicles.find((vehicle) => vehicle.id === vehicleId)?.badge ?? 'Not assigned'}</span></p>
          <label className="detail-line"><strong>Assignment message</strong><textarea className="form-control" value={message} onChange={(event) => setMessage(event.target.value)} rows="2" /></label>
        </>
      ) : (
        <p className="detail-line"><strong>Assigned vehicle</strong><span>{ownVehicle?.id ?? 'Not linked'}</span></p>
      )}
      <div className="form-actions">
        <button className="btn-primary" type="submit">Save changes</button>
        <button className="btn-primary" type="button" onClick={onCancel}>Cancel</button>
        {isDispatcher && (
          <button className="btn-danger" type="button" onClick={() => onDelete(emergency.id)}>
            Delete emergency
          </button>
        )}
      </div>
    </form>
  )
}

function InfoLine({ label, value }) {
  return <p className="detail-line"><strong>{label}</strong><span>{value || 'Not recorded'}</span></p>
}

export default function Emergencies() {
  const location = useLocation()
  const { user } = useAuth()
  const {
    emergencies,
    archivedEmergencies,
    patients,
    vehicles,
    createEmergency,
    updateEmergency,
    deleteEmergency,
  } = useOperations()
  const access = accessForRole(user?.role)
  const visibleEmergencies = user?.role === 'Lead Paramedic'
    ? emergencies.filter((emergency) => emergency.assignedParamedicBadge === user.badge)
    : emergencies
  const visibleArchivedEmergencies = user?.role === 'Lead Paramedic'
    ? archivedEmergencies.filter((emergency) => emergency.assignedParamedicBadge === user.badge)
    : archivedEmergencies
  const requestedEmergencyId = location.state?.selectedEmergencyId
  const initialEmergency = visibleEmergencies.find((emergency) => emergency.id === requestedEmergencyId)
  const [selectedId, setSelectedId] = useState(
    initialEmergency?.id ?? visibleEmergencies[0]?.id ?? null,
  )
  const [isNewEmergencyOpen, setIsNewEmergencyOpen] = useState(false)
  const [isEmergencyEditorOpen, setIsEmergencyEditorOpen] = useState(false)
  const [isArchiveView, setIsArchiveView] = useState(false)
  const [profilePatient, setProfilePatient] = useState(null)
  const displayedEmergencies = isArchiveView ? visibleArchivedEmergencies : visibleEmergencies
  const selectedEmergency = displayedEmergencies.find((emergency) => emergency.id === selectedId)
    ?? displayedEmergencies[0]
  const locations = displayedEmergencies.map((emergency) => ({
    id: `emergency-${emergency.id}`,
    name: `Emergency #${emergency.id}`,
    subtitle: `${emergency.priority} · ${emergency.status}`,
    kind: 'emergency',
    label: 'E',
    position: emergency.position,
    sourceId: emergency.id,
  }))
  const activeSelectedId = selectedEmergency?.id ?? null
  const mapSelectedId = selectedEmergency ? `emergency-${selectedEmergency.id}` : null
  const patient = selectedEmergency
    ? patients.find((item) => item.id === selectedEmergency.patientId)
    : null
  const patientEmergencyHistory = profilePatient
    ? (profilePatient.id == null
      ? [selectedEmergency].filter(Boolean)
      : [...emergencies, ...archivedEmergencies]
        .filter((emergency) => emergency.patientId === profilePatient.id))
      .sort((first, second) => second.id - first.id)
    : []

  const completeDispatch = async () => {
    if (!selectedEmergency || !window.confirm(`Complete dispatch for emergency #${selectedEmergency.id}?`)) {
      return
    }
    const completed = await updateEmergency(selectedEmergency.id, { status: 'Completed' })
    if (!completed) return
    setSelectedId(selectedEmergency.id)
    setIsArchiveView(true)
    setIsEmergencyEditorOpen(false)
  }

  return (
    <>
      <h1>Emergencies</h1>
      <p className="lead">
        {user?.role === 'Dispatcher'
          ? 'Manage the emergency queue, vehicle assignments, and paramedic messages.'
          : user?.role === 'Lead Paramedic'
            ? 'Review and update emergencies assigned to your field unit.'
            : 'Read-only emergency and assignment records.'}
      </p>
      <div className="emergencies-page-layout">
        <section>
          <div className="emergency-list-header">
            <div className="section-heading">
              <h2>{isArchiveView ? 'Previous emergencies' : 'Dispatch queue'}</h2>
              <span>{displayedEmergencies.length} {isArchiveView ? 'archived' : 'active'}</span>
            </div>
            <div className="emergency-list-tabs" role="group" aria-label="Emergency list">
              <button
                type="button"
                className={!isArchiveView ? 'active' : ''}
                aria-pressed={!isArchiveView}
                onClick={() => {
                  setIsArchiveView(false)
                  setSelectedId(visibleEmergencies[0]?.id ?? null)
                  setIsEmergencyEditorOpen(false)
                }}
              >
                Active
              </button>
              <button
                type="button"
                className={isArchiveView ? 'active' : ''}
                aria-pressed={isArchiveView}
                onClick={() => {
                  setIsArchiveView(true)
                  setSelectedId(visibleArchivedEmergencies[0]?.id ?? null)
                  setIsEmergencyEditorOpen(false)
                }}
              >
                Archive
              </button>
            </div>
          </div>
          {displayedEmergencies.length
            ? (
              <SelectableList
                items={displayedEmergencies.map((emergency) => ({
                  id: emergency.id,
                  name: `#${emergency.id} · ${emergency.address}`,
                  subtitle: `${emergency.patient} · ${emergency.priority} · ${emergency.status}`,
                }))}
                selectedId={activeSelectedId}
                onSelect={(id) => {
                  setSelectedId(id)
                  setIsEmergencyEditorOpen(false)
                }}
                getTitle={(item) => item.name}
                getSubtitle={(item) => item.subtitle}
              />
            )
            : <p className="panel empty-state">
              {isArchiveView
                ? 'No completed emergencies are archived yet.'
                : user?.role === 'Lead Paramedic'
                  ? 'No emergencies are assigned to this field unit.'
                  : 'No active emergencies in the dispatch queue.'}
            </p>}
          {!isArchiveView && (access.canManageEmergencies || access.canCreateEmergencies) && (
            <>
              <button
                className="btn-primary emergency-create-toggle"
                type="button"
                aria-expanded={isNewEmergencyOpen}
                onClick={() => setIsNewEmergencyOpen((open) => !open)}
              >
                {isNewEmergencyOpen ? 'Cancel new emergency' : 'New emergency'}
              </button>
              {isNewEmergencyOpen && (
                <NewEmergencyForm
                  user={user}
                  vehicles={vehicles}
                  patients={patients}
                  onCreate={async (values) => {
                    const created = await createEmergency(values)
                    if (!created) return false
                    setSelectedId(created.id)
                    setIsNewEmergencyOpen(false)
                    return true
                  }}
                />
              )}
            </>
          )}
        </section>
        <section>
          <LocationWorkspace
            locations={locations}
            selectedId={mapSelectedId}
            onSelect={(id) => {
              setSelectedId(Number(id.replace('emergency-', '')))
              setIsEmergencyEditorOpen(false)
            }}
          >
            {!selectedEmergency && <p>Select an emergency to review its dispatch details.</p>}
            {selectedEmergency && (
              <>
                <h2>Emergency #{selectedEmergency.id}</h2>
                {!isEmergencyEditorOpen && (
                  <>
                    <InfoLine label="Address" value={selectedEmergency.address} />
                    <div className="detail-line emergency-patient-line">
                      <strong>Patient</strong>
                      {user?.role === 'Hospital Admin' ? (
                        <button
                          className="patient-profile-link"
                          type="button"
                          onClick={() => setProfilePatient(patient ?? {
                            id: null,
                            name: selectedEmergency.patient,
                            condition: '',
                            status: '',
                            age: null,
                            allergies: '',
                            medicalHistory: '',
                          })}
                        >
                          {patient?.name ?? selectedEmergency.patient ?? 'Patient information unavailable'}
                          <span aria-hidden="true">View patient profile →</span>
                        </button>
                      ) : (
                        <span>{patient?.name ?? selectedEmergency.patient}</span>
                      )}
                    </div>
                    <InfoLine label="Condition" value={patient?.condition} />
                    <InfoLine label="Priority" value={selectedEmergency.priority} />
                    <InfoLine label="Status" value={selectedEmergency.status} />
                    <InfoLine label="EMS vehicle" value={selectedEmergency.vehicle} />
                    <InfoLine label="Reported" value={selectedEmergency.reported} />
                    {user?.role !== 'Dispatcher' && patient && (
                      <>
                        <InfoLine label="Age" value={patient.age} />
                        <InfoLine label="Allergies" value={patient.allergies} />
                        <InfoLine label="Medical history" value={patient.medicalHistory} />
                      </>
                    )}
                    {selectedEmergency.assignmentMessage && (
                      <InfoLine label="Dispatcher message" value={selectedEmergency.assignmentMessage} />
                    )}
                    {(access.canManageEmergencies || access.canViewAllRecords) && (
                      <InfoLine label="Assigned paramedic" value={selectedEmergency.assignedParamedicBadge} />
                    )}
                  </>
                )}
                {!isArchiveView && (access.canManageEmergencies || access.canEditAssignedEmergencies) && (
                  <>
                    {!isEmergencyEditorOpen && (
                      <div className="emergency-detail-actions">
                        <button
                          className="btn-primary"
                          type="button"
                          onClick={() => setIsEmergencyEditorOpen(true)}
                        >
                          {access.canManageEmergencies ? 'Edit dispatch' : 'Edit emergency'}
                        </button>
                        <button className="btn-complete-dispatch" type="button" onClick={completeDispatch}>
                          Complete dispatch
                        </button>
                      </div>
                    )}
                    {isEmergencyEditorOpen && (
                      <EmergencyEditor
                        key={selectedEmergency.id}
                        emergency={selectedEmergency}
                        user={user}
                        patients={patients}
                        vehicles={vehicles}
                        onSave={async (updates) => {
                          const saved = await updateEmergency(selectedEmergency.id, updates)
                          if (saved) setIsEmergencyEditorOpen(false)
                          return saved
                        }}
                        onCancel={() => setIsEmergencyEditorOpen(false)}
                        onDelete={access.canManageEmergencies
                          ? async (id) => {
                            if (window.confirm(`Delete emergency #${id}?`)) {
                              const deleted = await deleteEmergency(id)
                              if (!deleted) return
                              setSelectedId(null)
                              setIsEmergencyEditorOpen(false)
                            }
                          }
                          : undefined}
                      />
                    )}
                  </>
                )}
              </>
            )}
          </LocationWorkspace>
        </section>
      </div>
      <p className="data-storage-note">Emergency and dispatch changes are saved to MySQL.</p>
      {profilePatient && (
        <PatientProfileDialog
          patient={profilePatient}
          history={patientEmergencyHistory}
          onClose={() => setProfilePatient(null)}
        />
      )}
    </>
  )
}
