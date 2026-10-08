import { emergencies, vehicles, hospitals } from '../data'
import EmergencyRow from '../components/EmergencyRow'
import { useAuth } from '../context/AuthContext'

const ROLE_DASHBOARDS = {
  Dispatcher: {
    title: 'Dispatch operations',
    description: 'Coordinate active calls and monitor unit availability.',
  },
  'Lead Paramedic': {
    title: 'Field unit dashboard',
    description: 'Review your assigned calls and nearby receiving hospitals.',
  },
  'Hospital Admin': {
    title: 'Hospital network dashboard',
    description: 'Review emergency activity and current hospital capacity.',
  },
}

export default function Dashboard() {
  const { user } = useAuth()
  const assignedEmergencies = user?.role === 'Lead Paramedic'
    ? emergencies.filter((emergency) => emergency.assignedParamedicBadge === user.badge)
    : emergencies
  const userVehicle = vehicles.find((vehicle) => vehicle.badge === user?.badge)
  const visibleVehicles = user?.role === 'Lead Paramedic'
    ? vehicles.filter((vehicle) => vehicle.id === userVehicle?.id)
    : vehicles
  const free = visibleVehicles.filter((v) => v.status === 'Available').length
  const beds = hospitals.reduce((sum, h) => sum + h.beds, 0)
  const waiting = assignedEmergencies.filter((e) => !e.vehicle).length
  const dashboard = ROLE_DASHBOARDS[user?.role] ?? {
    title: 'Operations dashboard',
    description: 'Review current emergency and resource status.',
  }

  return (
    <>
      <h1>{dashboard.title}</h1>
      <p className="lead">
        {dashboard.description}<br />
        {assignedEmergencies.length} {user?.role === 'Lead Paramedic' ? 'assigned' : 'active'} emergencies;
        {' '}{waiting} patient(s) still need a vehicle.
        <br />
        {free} / {visibleVehicles.length} {user?.role === 'Lead Paramedic' ? 'assigned vehicle(s)' : 'vehicles'} available;
        {' '}{beds} hospital beds are open.
      </p>
      <div className="grid">
        <section>
          <h2>Emergency queue</h2>
          {assignedEmergencies.map((e) => <EmergencyRow key={e.id} e={e} />)}
        </section>
        <section>
          <h2>Live map</h2>
          <div className="map-placeholder">
            <p>Live map coming soon. Vehicle positions will appear here.</p>
          </div>
        </section>
      </div>
    </>
  )
}
