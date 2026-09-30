import { emergencies } from '../data'
import EmergencyRow from '../components/EmergencyRow'

export default function Emergencies() {
  return (
    <>
      <h1>Emergencies</h1>
      <p className="lead">Open calls, with their priority and assigned vehicle.</p>
      {emergencies.map((e) => <EmergencyRow key={e.id} e={e} />)}
    </>
  )
}
