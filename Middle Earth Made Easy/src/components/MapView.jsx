import { MapContainer, ImageOverlay, Marker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './MapView.css'
import middleEarthMap from '../assets/middle-earth-map.jpg'

const IMAGE_WIDTH = 10000
const IMAGE_HEIGHT = 5455
const bounds = [[0, 0], [IMAGE_HEIGHT, IMAGE_WIDTH]]

const testIcon = L.divIcon({
  className: '',
  html: `<button class="map-marker-btn">Test</button>`,
  iconSize: [64, 32],
  iconAnchor: [32, 32],
})

export default function MapView() {
  return (
    <MapContainer
      crs={L.CRS.Simple}
      bounds={bounds}
      maxBounds={bounds}
      maxBoundsViscosity={1.0}
      style={{ width: '100vw', height: '100vh', background: '#1a1208' }}
      minZoom={-3}
      maxZoom={0}
      zoomSnap={0.25}
    >
      <ImageOverlay url={middleEarthMap} bounds={bounds} />
      <Marker
        position={[IMAGE_HEIGHT / 2, IMAGE_WIDTH / 2]}
        icon={testIcon}
      />
    </MapContainer>
  )
}
