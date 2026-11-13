import { useEffect } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'

const MAP_CENTER = [35.8456, -86.3903]

function MapCenter({ position, isExpanded }) {
  const map = useMap()
  useEffect(() => {
    if (!isExpanded) return undefined

    const frame = requestAnimationFrame(() => {
      map.invalidateSize({ pan: false })
      map.setView(position ?? MAP_CENTER, position ? 15 : 11)
    })
    return () => cancelAnimationFrame(frame)
  }, [isExpanded, map, position])
  return null
}

function markerIcon(kind, label, isSelected, hasSelection) {
  const size = isSelected ? 46 : hasSelection ? 28 : 36
  const classes = [
    'map-pin',
    `map-pin--${kind}`,
    isSelected && 'map-pin--focused',
    hasSelection && !isSelected && 'map-pin--dimmed',
  ].filter(Boolean).join(' ')

  return L.divIcon({
    className: 'operations-map-icon',
    html: `<span class="${classes}">${label}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

export default function OperationsMap({ locations, selectedId, onSelect, height = 280, isExpanded }) {
  const selected = locations.find((location) => location.id === selectedId)

  return (
    <div className="map-frame" style={{ height }}>
      <MapContainer center={MAP_CENTER} zoom={11} scrollWheelZoom className="operations-map">
        <MapCenter position={selected?.position} isExpanded={isExpanded} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {locations.map((location) => (
          <Marker
            key={location.id}
            position={location.position}
            icon={markerIcon(
              location.kind,
              location.label,
              selectedId === location.id,
              Boolean(selectedId),
            )}
            title={location.name}
            zIndexOffset={selectedId === location.id ? 1000 : 0}
            eventHandlers={{ click: () => onSelect(location.id) }}
          >
            {selectedId === location.id && (
              <Popup>
                <strong>{location.name}</strong>
                {location.subtitle && <div>{location.subtitle}</div>}
              </Popup>
            )}
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
