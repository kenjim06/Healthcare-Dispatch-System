import { emergencies, vehicles, hospitals } from '../data'
import EmergencyRow from '../components/EmergencyRow'

export default function Dashboard() {
  const free = vehicles.filter((v) => v.status === 'Available').length
  const beds = hospitals.reduce((sum, h) => sum + h.beds, 0)
  const waiting = emergencies.filter((e) => !e.vehicle).length

  return (
    <>
      <h1>{emergencies.length} active emergencies</h1>
      <p className="lead">
        {waiting} patient(s) still need a vehicle <br/> {free} / {vehicles.length} vehicles are available <br/> {beds} hospital beds are open.
      </p>
      <div className="grid">
        <section>
          <h2>Emergency queue</h2>
          {emergencies.map((e) => <EmergencyRow key={e.id} e={e} />)}
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
