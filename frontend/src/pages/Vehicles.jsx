import { useState } from 'react'
import LocationWorkspace, { SelectableList } from '../components/LocationWorkspace'
import { useAuth } from '../context/AuthContext'
import { useOperations } from '../context/OperationsContext'
import { accessForRole } from '../roleAccess'

function VehicleEditor({ vehicle, paramedics, onSave, onCancel }) {
  const [form, setForm] = useState({
    location: vehicle.location,
    status: vehicle.status,
    crew: vehicle.crew,
    notes: vehicle.notes ?? '',
    assignedParamedicBadge: vehicle.badge ?? '',
  })
  const update = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const submit = (event) => {
    event.preventDefault()
    onSave({
      location: form.location.trim(),
      status: form.status,
      crew: Number(form.crew),
      notes: form.notes.trim(),
      ...(form.assignedParamedicBadge !== (vehicle.badge ?? '')
        ? { assignedParamedicBadge: form.assignedParamedicBadge || null }
        : {}),
    })
  }

  return (
    <form className="detail-form" onSubmit={submit}>
      <label className="detail-line"><strong>Location</strong><input className="form-control" name="location" value={form.location} onChange={update} required /></label>
      <label className="detail-line"><strong>Status</strong>
        <select className="form-control" name="status" value={form.status} onChange={update}>
          {['Available', 'En route', 'On scene', 'Out of service'].map((status) => <option key={status}>{status}</option>)}
        </select>
      </label>
      <label className="detail-line"><strong>Crew</strong><input className="form-control" name="crew" type="number" min="0" value={form.crew} onChange={update} required /></label>
      <label className="detail-line"><strong>Assigned paramedic account</strong>
        <select
          className="form-control"
          name="assignedParamedicBadge"
          value={form.assignedParamedicBadge}
          onChange={update}
        >
          <option value="">Not assigned</option>
          {form.assignedParamedicBadge && !paramedics.some((paramedic) => paramedic.badge === form.assignedParamedicBadge) && (
            <option value={form.assignedParamedicBadge}>
              Unavailable account · badge {form.assignedParamedicBadge}
            </option>
          )}
          {paramedics.map((paramedic) => (
            <option key={paramedic.id} value={paramedic.badge}>
              {paramedic.name} · badge {paramedic.badge}
            </option>
          ))}
        </select>
        <small className="muted">Only active Lead Paramedic accounts are listed.</small>
      </label>
      <label className="detail-line"><strong>Dispatch notes</strong><textarea className="form-control" name="notes" value={form.notes} onChange={update} rows="3" /></label>
      <div className="form-actions">
        <button className="btn-primary" type="submit">Save changes</button>
        <button className="btn-primary" type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}

function InfoLine({ label, value }) {
  return <p className="detail-line"><strong>{label}</strong><span>{value || 'Not recorded'}</span></p>
}

export default function Vehicles() {
  const { user } = useAuth()
  const { vehicles, paramedics, updateVehicle } = useOperations()
  const access = accessForRole(user?.role)
  const visibleVehicles = user?.role === 'Lead Paramedic'
    ? vehicles.filter((vehicle) => vehicle.badge === user.badge)
    : vehicles
  const [selectedId, setSelectedId] = useState(visibleVehicles[0]?.id ?? null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const selectedVehicle = visibleVehicles.find((vehicle) => vehicle.id === selectedId)
    ?? visibleVehicles[0]
  const locations = visibleVehicles.map((vehicle) => ({
    id: `vehicle-${vehicle.id}`,
    name: vehicle.id,
    subtitle: `${vehicle.status} · ${vehicle.location}`,
    kind: 'vehicle',
    label: 'V',
    position: vehicle.position,
  }))

  return (
    <>
      <h1>EMS vehicles</h1>
      <p className="lead">
        {user?.role === 'Dispatcher'
          ? 'Select an EMS vehicle to view its map position and update dispatch details.'
          : user?.role === 'Lead Paramedic'
            ? 'Your assigned EMS vehicle and current location.'
            : 'Read-only vehicle locations, assignments, and dispatch information.'}
      </p>
      <div className="vehicle-page-layout">
        <section>
          <h2>Vehicle fleet</h2>
          {visibleVehicles.length
            ? (
              <SelectableList
                items={visibleVehicles.map((vehicle) => ({
                  id: vehicle.id,
                  name: vehicle.id,
                  subtitle: `${vehicle.status} · ${vehicle.location}`,
                }))}
                selectedId={selectedId ?? selectedVehicle?.id ?? null}
                onSelect={(id) => {
                  setSelectedId(id)
                  setIsEditorOpen(false)
                }}
                getTitle={(item) => item.name}
                getSubtitle={(item) => item.subtitle}
              />
            )
            : <p className="panel empty-state">No vehicle is linked to this paramedic account.</p>}
        </section>
        <section>
          <LocationWorkspace
            locations={locations}
            selectedId={selectedVehicle ? `vehicle-${selectedVehicle.id}` : null}
            onSelect={(id) => {
              setSelectedId(id.replace('vehicle-', ''))
              setIsEditorOpen(false)
            }}
          >
            {!selectedVehicle && <p>Select a vehicle to see its details.</p>}
            {selectedVehicle && (
              <>
                <h2>{selectedVehicle.id}</h2>
                {!isEditorOpen && (
                  <>
                    <InfoLine label="Status" value={selectedVehicle.status} />
                    <InfoLine label="Location" value={selectedVehicle.location} />
                    <InfoLine label="Crew" value={selectedVehicle.crew} />
                    <InfoLine label="Assigned paramedic" value={selectedVehicle.badge} />
                    {access.canViewAllRecords && <InfoLine label="Service area" value={selectedVehicle.area} />}
                    <InfoLine label="Dispatch notes" value={selectedVehicle.notes} />
                  </>
                )}
                {access.canManageVehicles && (
                  <>
                    {!isEditorOpen && (
                      <button
                        className="btn-primary"
                        type="button"
                        onClick={() => setIsEditorOpen(true)}
                      >
                        Edit vehicle information
                      </button>
                    )}
                    {isEditorOpen && (
                      <VehicleEditor
                        key={selectedVehicle.id}
                        vehicle={selectedVehicle}
                        paramedics={paramedics}
                        onSave={async (updates) => {
                          const saved = await updateVehicle(selectedVehicle.id, updates)
                          if (saved) setIsEditorOpen(false)
                          return saved
                        }}
                        onCancel={() => setIsEditorOpen(false)}
                      />
                    )}
                  </>
                )}
              </>
            )}
          </LocationWorkspace>
        </section>
      </div>
      <p className="data-storage-note">Vehicle changes are saved to MySQL.</p>
    </>
  )
}
