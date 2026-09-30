import Badge from './Badge'

export default function EmergencyRow({ e }) {
  return (
    <div className={`row ${e.priority}`}>
      <div>
        <strong>#{e.id} &middot; {e.address}</strong>
        <div className="muted">
          {e.patient} &middot; reported {e.reported} &middot; {e.vehicle ?? 'No vehicle assigned'}
        </div>
      </div>
      <div className="row-badges">
        <Badge label={e.priority} />
        <Badge label={e.status} />
      </div>
    </div>
  )
}
