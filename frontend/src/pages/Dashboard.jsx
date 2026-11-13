import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import OperationsMap from '../components/OperationsMap'
import { MapLegend, SelectableList } from '../components/LocationWorkspace'
import { useAuth } from '../context/AuthContext'
import { useOperations } from '../context/OperationsContext'

const ROLE_DASHBOARDS = {
  Dispatcher: {
    title: 'Dispatch Operations',
    description: 'Coordinate active calls and monitor unit availability.',
  },
  'Lead Paramedic': {
    title: 'Field Unit Dashboard',
    description: 'Review assigned calls and nearby hospitals.',
  },
  'Hospital Admin': {
    title: 'Hospital Network Dashboard',
    description: 'Review emergency activity and current hospital capacity.',
  },
}

function InfoLine({ label, value }) {
  return <p className="detail-line"><strong>{label}</strong><span>{value || 'Not Recorded'}</span></p>
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { emergencies, vehicles, hospitals, patients } = useOperations()
  const [selectedId, setSelectedId] = useState(null)
  const isParamedic = user?.role === 'Lead Paramedic'
  const assignedEmergencies = isParamedic
    ? emergencies.filter((emergency) => emergency.assignedParamedicBadge === user.badge)
    : emergencies
  const assignedVehicle = vehicles.find((vehicle) => vehicle.badge === user?.badge)
  const visibleVehicles = isParamedic
    ? vehicles.filter((vehicle) => vehicle.id === assignedVehicle?.id)
    : vehicles
  const visibleHospitals = isParamedic && assignedVehicle?.area
    ? hospitals.filter((hospital) => hospital.area === assignedVehicle.area)
    : hospitals
  const locations = [
    ...assignedEmergencies.map((emergency) => ({
      id: `emergency-${emergency.id}`,
      sourceId: emergency.id,
      kind: 'emergency',
      label: 'E',
      name: `Emergency #${emergency.id}`,
      subtitle: `${emergency.priority} · ${emergency.status}`,
      position: emergency.position,
    })),
    ...visibleVehicles.map((vehicle) => ({
      id: `vehicle-${vehicle.id}`,
      sourceId: vehicle.id,
      kind: 'vehicle',
      label: 'V',
      name: vehicle.id,
      subtitle: `${vehicle.status} · ${vehicle.location}`,
      position: vehicle.position,
    })),
    ...visibleHospitals.map((hospital) => ({
      id: `hospital-${hospital.id}`,
      sourceId: hospital.id,
      kind: 'hospital',
      label: 'H',
      name: hospital.name,
      subtitle: hospital.city,
      position: hospital.position,
    })),
  ]
  const selectedLocation = locations.find((location) => location.id === selectedId)
    ?? locations[0]
  const dashboard = ROLE_DASHBOARDS[user?.role] ?? {
    title: 'Operations dashboard',
    description: 'Review current emergency and resource status.',
  }
  const free = visibleVehicles.filter((vehicle) => vehicle.status === 'Available').length
  const beds = hospitals.reduce((sum, hospital) => sum + hospital.beds, 0)
  const waitingEmergencies = assignedEmergencies.filter((emergency) => !emergency.vehicle)
  const priorityRank = { High: 3, Medium: 2, Low: 1 }
  const highestPriorityWaiting = [...waitingEmergencies].sort(
    (first, second) => (priorityRank[second.priority] ?? 0) - (priorityRank[first.priority] ?? 0),
  )[0]
  const waiting = waitingEmergencies.length
  const hospitalReference = selectedLocation?.position
  const hospitalCandidates = isParamedic ? visibleHospitals : hospitals
  const nearestHospital = hospitalReference
    ? hospitalCandidates.reduce((nearest, hospital) => {
      const [latitude, longitude] = hospital.position
      const [referenceLatitude, referenceLongitude] = hospitalReference
      const latitudeDistance = (latitude - referenceLatitude) * 111
      const longitudeDistance = (longitude - referenceLongitude)
        * 111
        * Math.cos((referenceLatitude * Math.PI) / 180)
      const distance = Math.hypot(latitudeDistance, longitudeDistance)
      return !nearest || distance < nearest.distance
        ? { hospital, distance }
        : nearest
    }, null)?.hospital
    : hospitalCandidates[0]

  const selectedEmergency = selectedLocation?.kind === 'emergency'
    ? emergencies.find((emergency) => emergency.id === selectedLocation.sourceId)
    : null
  const selectedPatient = selectedEmergency
    ? patients.find((patient) => patient.id === selectedEmergency.patientId)
    : null
  const selectedVehicle = selectedLocation?.kind === 'vehicle'
    ? vehicles.find((vehicle) => vehicle.id === selectedLocation.sourceId)
    : null
  const selectedHospital = selectedLocation?.kind === 'hospital'
    ? hospitals.find((hospital) => hospital.id === selectedLocation.sourceId)
    : null

  return (
    <div className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <h1>{dashboard.title}</h1>
          <p className="lead">{dashboard.description}</p>
        </div>
        <Link className="dashboard-create-link" to="/emergencies">Open Dispatch Queue</Link>
      </div>
      <div className="dashboard-console">
        <aside className="dashboard-rail">
          <section className="dashboard-rail-map">
            <div className="section-heading">
              <h2>Operations Map</h2>
              <span>{locations.length} locations</span>
            </div>
            <OperationsMap
              locations={locations}
              selectedId={selectedId ?? selectedLocation?.id ?? null}
              onSelect={setSelectedId}
              isExpanded
            />
            <MapLegend locations={locations} />
          </section>
          <section className="dashboard-rail-queue">
            <div className="section-heading">
              <h2>Emergency Queue</h2>
              <Link to="/emergencies">View All</Link>
            </div>
            {assignedEmergencies.length > 0 ? (
              <SelectableList
                items={assignedEmergencies.map((emergency) => ({
                  id: `emergency-${emergency.id}`,
                  name: `#${emergency.id} · ${emergency.address}`,
                  subtitle: `${emergency.patient} · ${emergency.priority} · ${emergency.status}`,
                }))}
                selectedId={selectedLocation?.id ?? null}
                onSelect={setSelectedId}
                getTitle={(item) => item.name}
                getSubtitle={(item) => item.subtitle}
              />
            ) : (
              <p className="panel empty-state">No active emergencies in queue.</p>
            )}
          </section>
        </aside>
        <main className="dashboard-stage">
          <section className="dashboard-summary" aria-label="Current operations">
            <div className="section-heading">
              <h2>Current Operations</h2>
              <span>Live Database Overview</span>
            </div>
            <div className="dashboard-metrics">
              <button
                className="dashboard-metric dashboard-metric--emergencies"
                type="button"
                onClick={() => navigate('/emergencies')}
              >
                <span className="dashboard-metric-label">{isParamedic ? 'Assigned emergencies' : 'Active emergencies'}</span>
                <strong>{assignedEmergencies.length}</strong>
                <span className="dashboard-metric-note">Calls In Response Queue</span>
              </button>
              <button
                className="dashboard-metric dashboard-metric--waiting"
                type="button"
                disabled={!highestPriorityWaiting}
                onClick={() => navigate('/emergencies', {
                  state: { selectedEmergencyId: highestPriorityWaiting.id },
                })}
              >
                <span className="dashboard-metric-label">Awaiting Vehicle</span>
                <strong>{waiting}</strong>
                <span className="dashboard-metric-note">Call may require unit</span>
              </button>
              <button
                className="dashboard-metric dashboard-metric--vehicles"
                type="button"
                onClick={() => navigate('/vehicles')}
              >
                <span className="dashboard-metric-label">Available Units</span>
                <strong>{free}<span className="dashboard-metric-total"> / {visibleVehicles.length}</span></strong>
                <span className="dashboard-metric-note">{isParamedic ? 'Your unit readiness' : 'Ready to dispatch'}</span>
              </button>
              <button
                className="dashboard-metric dashboard-metric--beds"
                type="button"
                disabled={!nearestHospital}
                onClick={() => navigate('/hospitals', {
                  state: { selectedHospitalId: nearestHospital.id },
                })}
              >
                <span className="dashboard-metric-label">Open Hospital Beds</span>
                <strong>{beds}</strong>
                <span className="dashboard-metric-note">Across our hospital network</span>
              </button>
            </div>
          </section>
          <div className="dashboard-stage-grid">
            <section className="dashboard-stage-panel dashboard-fleet-panel">
              <div className="section-heading">
                <h2>EMS Fleet</h2>
                <Link to="/vehicles">View Fleet</Link>
              </div>
              <div className="dashboard-resource-list">
                {visibleVehicles.length > 0 ? visibleVehicles.map((vehicle) => (
                  <button
                    className={`dashboard-resource-card${selectedId === `vehicle-${vehicle.id}` ? ' selected' : ''}`}
                    key={vehicle.id}
                    type="button"
                    onClick={() => setSelectedId(`vehicle-${vehicle.id}`)}
                  >
                    <span className={`resource-status-dot${vehicle.status === 'Available' ? ' is-available' : ''}`} />
                    <span className="dashboard-resource-copy">
                      <strong>{vehicle.id}</strong>
                      <small>{vehicle.location}</small>
                    </span>
                    <span className="resource-status">{vehicle.status}</span>
                  </button>
                )) : <p className="empty-state">No units linked to this account.</p>}
              </div>
            </section>
            <section className="dashboard-stage-panel dashboard-hospitals-panel">
              <div className="section-heading">
                <h2>Hospital readiness</h2>
                <Link to="/hospitals">View Hospitals</Link>
              </div>
              <div className="dashboard-resource-list">
                {visibleHospitals.length > 0 ? visibleHospitals.map((hospital) => (
                  <button
                    className={`dashboard-resource-card${selectedId === `hospital-${hospital.id}` ? ' selected' : ''}`}
                    key={hospital.id}
                    type="button"
                    onClick={() => setSelectedId(`hospital-${hospital.id}`)}
                  >
                    <span className="resource-status-dot is-hospital" />
                    <span className="dashboard-resource-copy">
                      <strong>{hospital.name}</strong>
                      <small>{hospital.city}</small>
                    </span>
                    <span className="resource-status">{hospital.beds} beds</span>
                  </button>
                )                ) : <p className="empty-state">Hospital readiness data is currently unavailable.</p>}
              </div>
            </section>
          </div>
        </main>
        <aside className="dashboard-detail">
          <div className="dashboard-detail-heading">
            <span className="dashboard-detail-kicker">
              <i className={`map-legend-dot map-legend-dot--${selectedLocation?.kind ?? 'emergency'}`} />
              Selected {selectedLocation?.kind ?? 'operation'}
            </span>
            <span className="dashboard-detail-count">{selectedLocation ? 'ACTIVE' : '—'}</span>
          </div>
          {!selectedLocation && <p className="empty-state">Select a map marker or list an item to review its details.</p>}
          {selectedEmergency && (
            <>
              <h2>Emergency #{selectedEmergency.id}</h2>
              <InfoLine label="Address" value={selectedEmergency.address} />
              <InfoLine label="Priority" value={selectedEmergency.priority} />
              <InfoLine label="Status" value={selectedEmergency.status} />
              <InfoLine label="EMS vehicle" value={selectedEmergency.vehicle} />
              <InfoLine label="Patient" value={selectedPatient?.name ?? selectedEmergency.patient} />
              <InfoLine label="Condition" value={selectedPatient?.condition} />
              {user?.role === 'Hospital Admin' && (
                <>
                  <InfoLine label="Reported" value={selectedEmergency.reported} />
                  <InfoLine label="Assigned paramedic" value={selectedEmergency.assignedParamedicBadge} />
                  <InfoLine label="Dispatcher message" value={selectedEmergency.assignmentMessage} />
                </>
              )}
              {user?.role !== 'Dispatcher' && selectedPatient && (
                <>
                  <InfoLine label="Age" value={selectedPatient.age} />
                  <InfoLine label="Allergies" value={selectedPatient.allergies} />
                  <InfoLine label="Medical history" value={selectedPatient.medicalHistory} />
                </>
              )}
              <Link className="dashboard-detail-link" to="/emergencies" state={{ selectedEmergencyId: selectedEmergency.id }}>
                Open Emergency Details
              </Link>
            </>
          )}
          {selectedVehicle && (
            <>
              <h2>{selectedVehicle.id}</h2>
              <InfoLine label="Status" value={selectedVehicle.status} />
              <InfoLine label="Location" value={selectedVehicle.location} />
              <InfoLine label="Crew" value={selectedVehicle.crew} />
              {user?.role === 'Hospital Admin' && (
                <>
                  <InfoLine label="Assigned paramedic" value={selectedVehicle.badge} />
                  <InfoLine label="Service area" value={selectedVehicle.area} />
                  <InfoLine label="Dispatch notes" value={selectedVehicle.notes} />
                </>
              )}
              <Link className="dashboard-detail-link" to="/vehicles">
                Open Vehicle Details
              </Link>
            </>
          )}
          {selectedHospital && (
            <>
              <h2>{selectedHospital.name}</h2>
              <InfoLine label="City" value={selectedHospital.city} />
              <InfoLine label="Open beds" value={selectedHospital.beds} />
              <InfoLine label="ER wait" value={selectedHospital.erWait} />
              <Link className="dashboard-detail-link" to="/hospitals" state={{ selectedHospitalId: selectedHospital.id }}>
                Open Hospital Details
              </Link>
            </>
          )}
        </aside>
      </div>
    </div>
  )
}
