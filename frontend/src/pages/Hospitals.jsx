import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import LocationWorkspace, { SelectableList } from '../components/LocationWorkspace'
import { useAuth } from '../context/AuthContext'
import { useOperations } from '../context/OperationsContext'
import { accessForRole } from '../roleAccess'

function InfoLine({ label, value }) {
  return <p className="detail-line"><strong>{label}</strong><span>{value || 'Not recorded'}</span></p>
}

export default function Hospitals() {
  const location = useLocation()
  const { user } = useAuth()
  const { hospitals, vehicles } = useOperations()
  const access = accessForRole(user?.role)
  const vehicle = vehicles.find((item) => item.badge === user?.badge)
  const visibleHospitals = user?.role === 'Lead Paramedic' && vehicle?.area
    ? hospitals.filter((hospital) => hospital.area === vehicle.area)
    : hospitals
  const requestedHospital = visibleHospitals.find(
    (hospital) => hospital.id === location.state?.selectedHospitalId,
  )
  const [selectedId, setSelectedId] = useState(
    requestedHospital?.id ?? visibleHospitals[0]?.id ?? null,
  )
  const selectedHospital = visibleHospitals.find((hospital) => hospital.id === selectedId)
    ?? visibleHospitals[0]
  const locations = visibleHospitals.map((hospital) => ({
    id: `hospital-${hospital.id}`,
    name: hospital.name,
    subtitle: `${hospital.city} · ${hospital.beds} open beds`,
    kind: 'hospital',
    label: 'H',
    position: hospital.position,
  }))

  return (
    <>
      <h1>{user?.role === 'Lead Paramedic' ? 'Area hospitals' : 'Hospitals'}</h1>
      <p className="lead">
        {user?.role === 'Lead Paramedic'
          ? `Receiving hospitals in your service area${vehicle?.area ? ` (${vehicle.area})` : ''}.`
          : 'Select a hospital to view its map location and capacity.'}
      </p>
      <div className="vehicle-page-layout">
        <section>
          <h2>Receiving hospitals</h2>
          <SelectableList
            items={visibleHospitals.map((hospital) => ({
              id: hospital.id,
              name: hospital.name,
              subtitle: `${hospital.city} · ${hospital.beds} open beds`,
            }))}
            selectedId={selectedId}
            onSelect={(id) => {
              setSelectedId(id)
            }}
            getTitle={(item) => item.name}
            getSubtitle={(item) => item.subtitle}
          />
        </section>
        <section>
          <LocationWorkspace
            locations={locations}
            selectedId={selectedHospital ? `hospital-${selectedHospital.id}` : null}
            onSelect={(id) => setSelectedId(Number(id.replace('hospital-', '')))}
          >
            {!selectedHospital && <p>Select a hospital to see its details.</p>}
            {selectedHospital && (
              <>
                <h2>{selectedHospital.name}</h2>
                <InfoLine label="City" value={selectedHospital.city} />
                <InfoLine label="Open beds" value={selectedHospital.beds} />
                <InfoLine label="ER wait" value={selectedHospital.erWait} />
                {access.canViewAllRecords && <InfoLine label="Service area" value={selectedHospital.area} />}
              </>
            )}
          </LocationWorkspace>
        </section>
      </div>
    </>
  )
}
