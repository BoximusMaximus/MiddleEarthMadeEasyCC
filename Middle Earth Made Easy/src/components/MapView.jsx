import { MapContainer, ImageOverlay, useMapEvents, Marker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './MapView.css'
import middleEarthMap from '../assets/middle-earth-map.jpg'
import PinMarker from './PinMarker'

const IMAGE_WIDTH  = 10000
const IMAGE_HEIGHT = 5455
const bounds = [[0, 0], [IMAGE_HEIGHT, IMAGE_WIDTH]]

function PreviewPin({ latlng }) {
  const icon = L.divIcon({
    className: '',
    html: '<div class="map-pin preview"></div>',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  })
  return <Marker position={[latlng.lat, latlng.lng]} icon={icon} interactive={false} zIndexOffset={1000} />
}

function MapClickHandler({ onMapClick, placementMode }) {
  useMapEvents({
    click(e) {
      if (placementMode) onMapClick(e.latlng)
    },
  })
  return null
}

export default function MapView({ pins, placementMode, selectedPin, newPinPosition, onMapClick, onPinClick }) {
  return (
    <MapContainer
      crs={L.CRS.Simple}
      bounds={bounds}
      maxBounds={bounds}
      maxBoundsViscosity={1.0}
      className={placementMode ? 'placement-mode' : ''}
      style={{ flex: 1, height: '100vh', background: '#1a1208' }}
      minZoom={-3}
      maxZoom={0}
      zoomSnap={0.25}
    >
      <ImageOverlay url={middleEarthMap} bounds={bounds} />
      <MapClickHandler onMapClick={onMapClick} placementMode={placementMode} />
      {newPinPosition && <PreviewPin latlng={newPinPosition} />}
      {pins.map(pin => (
        <PinMarker
          key={pin.id}
          pin={pin}
          selected={selectedPin?.id === pin.id}
          onClick={() => onPinClick(pin)}
        />
      ))}
    </MapContainer>
  )
}
