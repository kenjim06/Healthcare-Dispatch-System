import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from 'react-leaflet'

const MAP_CENTER = [35.8456, -86.3903]

function MapClickHandler({ onChange }) {
  useMapEvents({
    click(event) {
      onChange([event.latlng.lat, event.latlng.lng])
    },
  })
  return null
}

export default function EmergencyLocationPicker({ position, onChange }) {
  return (
    <div className="emergency-location-picker">
      <p className="location-picker-instructions">
        Click the map to place the incident pin, or drag it to the exact location.
        The address is not sent to a geocoding service.
      </p>
      <div className="map-frame location-picker-map">
        <MapContainer
          center={position ?? MAP_CENTER}
          zoom={position ? 15 : 11}
          scrollWheelZoom
          className="operations-map"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onChange={onChange} />
          {position && (
            <Marker
              position={position}
              draggable
              eventHandlers={{
                dragend(event) {
                  const { lat, lng } = event.target.getLatLng()
                  onChange([lat, lng])
                },
              }}
            >
              <Popup>Emergency location pin</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
      {position ? (
        <p className="location-picker-coordinates">
          Pin: {position[0].toFixed(5)}, {position[1].toFixed(5)}
        </p>
      ) : (
        <p className="location-picker-required">Place a pin before adding this emergency.</p>
      )}
    </div>
  )
}
