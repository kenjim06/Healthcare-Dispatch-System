import Badge from './Badge'
import { patients } from '../data'

export default function EmergencyRow({ e }) {
  const patientCondition = patients.find((patient) => patient.id === e.patientId)?.condition

  return (
    <div className={`row ${e.priority}`}>
      <div>
        <strong>#{e.id} &middot; {e.address}</strong>
        <div className="muted">
          {e.patient}{patientCondition ? ` · ${patientCondition}` : ''}
          {' · '}reported {e.reported} · {e.vehicle ?? 'No vehicle assigned'}
        </div>
      </div>
      <div className="row-badges">
        <Badge label={e.priority} />
        <Badge label={e.status} />
      </div>
    </div>
  )
}
