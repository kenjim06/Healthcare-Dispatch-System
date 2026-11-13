import OperationsMap from './OperationsMap'

export function SelectableList({ items, selectedId, onSelect, getTitle, getSubtitle }) {
  return (
    <div className="selectable-list">
      {items.map((item) => (
        <button
          type="button"
          key={item.id}
          className={`selectable-item${item.id === selectedId ? ' selected' : ''}`}
          onClick={() => onSelect(item.id)}
          aria-pressed={item.id === selectedId}
        >
          <span className="selectable-item-icon" aria-hidden="true">●</span>
          <span>
            <strong>{getTitle(item)}</strong>
            <small>{getSubtitle(item)}</small>
          </span>
        </button>
      ))}
    </div>
  )
}

export function MapLegend({ locations }) {
  const kinds = new Set(locations.map((location) => location.kind))

  return (
    <div className="map-legend" aria-label="Map legend">
      {kinds.has('emergency') && (
        <span><i className="map-legend-dot map-legend-dot--emergency" />Emergency</span>
      )}
      {kinds.has('vehicle') && (
        <span><i className="map-legend-dot map-legend-dot--vehicle" />EMS unit</span>
      )}
      {kinds.has('hospital') && (
        <span><i className="map-legend-dot map-legend-dot--hospital" />Hospital</span>
      )}
    </div>
  )
}

export default function LocationWorkspace({
  locations,
  selectedId,
  onSelect,
  children,
}) {
  return (
    <div className="location-workspace">
      <section className="location-map-panel">
        <div className="section-heading">
          <h2>Operations map</h2>
          <span>{locations.length} locations</span>
        </div>
        <OperationsMap
          locations={locations}
          selectedId={selectedId}
          onSelect={onSelect}
          isExpanded
        />
        <MapLegend locations={locations} />
      </section>
      <aside className="location-detail">
        {children}
      </aside>
    </div>
  )
}
